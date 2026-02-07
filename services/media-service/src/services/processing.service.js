import ffmpeg from 'fluent-ffmpeg';
import { getSignedVideoUrl } from '@video-stream/shared/utils/s3.utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import createError from 'http-errors';

// Set paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

class ProcessingService {
  constructor(videoRepository, aiService, io = null, logger) {
    this.videoRepository = videoRepository;
    this.aiService = aiService;
    this.io = io;
    this.logger = logger;
  }

  // Simulate heavy processing
  async processVideo(videoId, tenantId) {
    let uploaderId = null;
    try {
      this.logger.info(`Starting processing for video ${videoId}`);
      // Note: Cannot emit to user yet as we haven't fetched the video.
      // We'll fetch video first.

      this.emitProgress(tenantId, null, videoId, 10, 'Processing started');

      const video = await this.videoRepository.findById(videoId, tenantId);
      if (!video) {
        throw createError(404, 'Video not found');
      }

      uploaderId = video.uploader.toString();

      video.processingStatus = 'PROCESSING';
      await video.save();

      // Step 1: Get Access URL
      // In a real scenario, we might download the file to disk for ffmpeg
      // For this MVP, we will try to probe directly from the signed URL if ffmpeg supports it,
      // or we just simulate the metadata extraction if network is an issue.
      const videoUrl = await getSignedVideoUrl(video.s3Key);

      // First, extract metadata to get duration
      let metadata;
      try {
        metadata = await this.extractMetadata(videoUrl);
      } catch (err) {
        this.logger.error(`Failed to extract metadata for video ${videoId}: ${err.message}`);
        throw createError(500, 'Failed to extract video metadata.');
      }

      video.duration = metadata.duration;

      // Fix: If size is 0, fetch actual size from metadata or S3
      if (video.size === 0 && metadata.size) {
        video.size = metadata.size;
      }

      this.emitProgress(tenantId, uploaderId, videoId, 20, 'Metadata extracted');

      // 2. Extract Frames for AI Analysis
      this.emitProgress(tenantId, uploaderId, videoId, 30, 'Extracting frames for analysis');

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `vidproc-${videoId}-`));
      const framePaths = [];
      const duration = metadata.duration || 5; // Use extracted duration
      // Grab 1 frame every 5 seconds
      const framesToGrab = Math.max(1, Math.floor(duration / 5));

      // Calculate timestamps (avoid 0s)
      const timestamps = [];
      for (let i = 1; i <= framesToGrab; i++) {
        timestamps.push(Math.max(0.5, Math.floor((i * duration) / (framesToGrab + 1))));
      }

      // Extract frames
      await new Promise((resolve, reject) => {
        ffmpeg(videoUrl) // Use the signed URL for ffmpeg input
          .screenshots({
            timestamps,
            filename: 'frame-%03d.jpg',
            folder: tmpDir,
            size: '640x?'
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Collect extracted frame paths
      const files = await fs.readdir(tmpDir);
      for (const file of files) {
        if (file.endsWith('.jpg')) {
          framePaths.push(path.join(tmpDir, file));
        }
      }

      this.logger.info(`Extracted ${framePaths.length} frames: ${files.join(', ')}`);

      // 3. AI Analysis
      this.emitProgress(tenantId, uploaderId, videoId, 60, 'Analyzing content with AI');
      const analysisResult = await this.aiService.analyzeFrames(framePaths);

      this.logger.info(`Analysis result for video ${videoId}: ${JSON.stringify(analysisResult)}`);

      // Cleanup Frames
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

      // 4. Update Database
      const isSafe = analysisResult.isSafe;
      const processingStatus = 'COMPLETED';
      const sensitivityStatus = isSafe ? 'SAFE' : 'FLAGGED';

      // Perform a single atomic update for all fields using Repository
      await this.videoRepository.updateProcessingOutcome(videoId, tenantId, {
        sensitivityAnalysis: {
          isSafe: analysisResult.isSafe,
          confidence: analysisResult.confidence,
          flags: analysisResult.flags,
          summary: analysisResult.summary,
          analyzedAt: new Date()
        },
        duration: metadata.duration,
        size: video.size, // Calculated earlier
        processingStatus,
        sensitivityStatus,
        processingProgress: 100
      });

      this.emitProgress(tenantId, uploaderId, videoId, 100, `Processing ${sensitivityStatus}`);

      this.logger.info(`Processing complete for video ${videoId} with status ${sensitivityStatus}`);
    } catch (error) {
      this.logger.error(`Processing error for video ${videoId}: ${error.message}`);
      // We assume uploaderId is known or we can try to find it?
      // If error happens before findById, we can't notify user easily.
      // But usually error happens during processing.
      // We'll try to use the scope's uploaderId if initialized,
      // otherwise skip user notification or fetch again.
      // For now, let's keep the signature simple and maybe fail to notify user
      // if video load failed.
      this.emitProgress(tenantId, uploaderId, videoId, 0, 'Processing failed');

      await this.videoRepository.model.findByIdAndUpdate(videoId, {
        processingStatus: 'FAILED'
      });
    }
  }

  emitProgress(tenantId, uploaderId, videoId, progress, message) {
    if (this.io) {
      const payload = {
        videoId,
        progress,
        message,
        status: progress === 100 ? 'COMPLETED' : 'PROCESSING'
      };

      // Emit to User (Private)
      if (uploaderId) {
        this.io.to(`user:${uploaderId}`).emit('video:processing:update', payload);
      }

      // Emit to Tenant (Admin/Dashboard) - Optional, keeping for admins
      this.io.to(`tenant:${tenantId}`).emit('admin:video:update', payload);
    }
  }

  async extractMetadata(videoUrl) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        resolve(metadata.format); // Return the format object which contains duration
      });
    });
  }
}

export default ProcessingService;
