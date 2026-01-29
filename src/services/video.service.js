import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import createError from 'http-errors';
import { VideoProcessor } from '../utils/video.processor.js';
import { Config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class VideoService {
  constructor(videoRepository, userRepository, logger, io = null) {
    this.videoRepository = videoRepository;
    this.userRepository = userRepository;
    this.logger = logger;
    this.io = io;
    this.uploadDir = Config.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.videoProcessor = new VideoProcessor(logger);
  }

  async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
      throw createError(500, 'Failed to initialize upload directory');
    }
  }

  async uploadVideo(file, metadata, userId, tenantId) {
    const { title, description } = metadata;

    // Ensure upload directory exists
    await this.ensureUploadDirectory();

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = path.extname(file.originalname);
    const filename = `${sanitizedTitle}_${timestamp}${extension}`;
    const filePath = path.join(this.uploadDir, tenantId.toString(), filename);

    // Ensure tenant directory exists
    const tenantDir = path.dirname(filePath);
    await fs.mkdir(tenantDir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Create video record
    const video = await this.videoRepository.create({
      tenantId,
      uploadedBy: userId,
      title,
      description,
      filename,
      originalFilename: file.originalname,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: 'uploading',
      processingProgress: 0
    });

    // Start processing asynchronously
    this.processVideo(video._id.toString(), tenantId.toString()).catch(error => {
      this.logger.error(`Video processing failed: ${error.message}`);
    });

    await video.populate('uploadedBy', 'email firstName lastName');

    return video;
  }

  async processVideo(videoId, tenantId) {
    try {
      // Update status to processing
      await this.videoRepository.updateStatus(videoId, 'processing', tenantId);

      const video = await this.videoRepository.findById(videoId, tenantId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Emit progress update
      this.emitProgress(videoId, tenantId, 10, 'Extracting metadata...');

      // Extract video metadata
      const metadata = await this.videoProcessor.extractMetadata(video.filePath);

      // Update video with metadata
      await this.videoRepository.updateById(
        videoId,
        {
          duration: metadata.duration,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            bitrate: metadata.bitrate,
            codec: metadata.codec
          }
        },
        tenantId
      );

      this.emitProgress(videoId, tenantId, 30, 'Analyzing content...');

      // Perform sensitivity analysis
      const analysis = await this.videoProcessor.analyzeSensitivity(video.filePath);

      this.emitProgress(videoId, tenantId, 80, 'Finalizing...');

      // Update video with analysis results
      const updatedVideo = await this.videoRepository.updateById(
        videoId,
        {
          status: analysis.isSafe ? 'completed' : 'flagged',
          sensitivityAnalysis: {
            isSafe: analysis.isSafe,
            confidence: analysis.confidence,
            flags: analysis.flags || [],
            analyzedAt: new Date()
          },
          processingProgress: 100
        },
        tenantId
      );

      this.emitProgress(videoId, tenantId, 100, 'Processing complete');

      this.logger.info(`Video processing completed: ${videoId}, Safe: ${analysis.isSafe}`);

      return updatedVideo;
    } catch (error) {
      this.logger.error(`Video processing error: ${error.message}`);
      await this.videoRepository.updateStatus(videoId, 'failed', tenantId);
      this.emitProgress(videoId, tenantId, 0, `Processing failed: ${error.message}`);
      throw error;
    }
  }

  emitProgress(videoId, tenantId, progress, message) {
    if (this.io) {
      this.io.to(`tenant:${tenantId}`).emit('video:progress', {
        videoId,
        progress,
        message,
        timestamp: new Date()
      });
    }
  }

  async getVideoById(videoId, tenantId) {
    const video = await this.videoRepository.findById(videoId, tenantId);
    if (!video) {
      throw createError(404, 'Video not found');
    }
    return video;
  }

  async getVideos(tenantId, options) {
    return this.videoRepository.findByTenant(tenantId, options);
  }

  async updateVideo(videoId, data, tenantId) {
    const video = await this.videoRepository.updateById(videoId, data, tenantId);
    if (!video) {
      throw createError(404, 'Video not found');
    }
    return video;
  }

  async deleteVideo(videoId, tenantId) {
    const video = await this.videoRepository.findById(videoId, tenantId);
    if (!video) {
      throw createError(404, 'Video not found');
    }

    // Delete file
    try {
      await fs.unlink(video.filePath);
    } catch (error) {
      this.logger.warn(`Failed to delete video file: ${error.message}`);
    }

    // Delete record
    await this.videoRepository.deleteById(videoId, tenantId);

    return { message: 'Video deleted successfully' };
  }

  async getVideoStream(videoId, tenantId, range) {
    const video = await this.videoRepository.findById(videoId, tenantId);
    if (!video) {
      throw createError(404, 'Video not found');
    }

    if (video.status !== 'completed' && video.status !== 'flagged') {
      throw createError(400, 'Video is not ready for streaming');
    }

    const filePath = video.filePath;
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(chunksize);
      await file.read(buffer, 0, chunksize, start);
      await file.close();

      return {
        buffer,
        start,
        end,
        chunksize,
        fileSize
      };
    }

    // Return full file if no range specified
    const file = await fs.readFile(filePath);
    return {
      buffer: file,
      start: 0,
      end: fileSize - 1,
      chunksize: fileSize,
      fileSize
    };
  }
}
