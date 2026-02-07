import createError from 'http-errors';
import { getSignedVideoUrl } from '@video-stream/shared/utils/s3.utils.js';

class VideoService {
  constructor(videoRepository, userRepository, processingService, storageService, logger) {
    this.videoRepository = videoRepository;
    this.userRepository = userRepository;
    this.processingService = processingService;
    this.storageService = storageService;
    this.logger = logger;
  }

  async uploadVideo(file, metadata, user, tenantId) {
    try {
      if (!file) {
        throw createError(400, 'No video file provided');
      }

      const videoData = {
        tenantId,
        uploader: user._id,
        title: metadata.title || file.originalname,
        description: metadata.description,
        filename: file.originalname,
        s3Key: file.key, // From multer-s3
        bucket: file.bucket, // From multer-s3
        mimetype: file.mimetype,
        size: file.size,
        sensitivityStatus: 'PENDING',
        processingStatus: 'PENDING'
      };

      const video = await this.videoRepository.create(videoData);
      this.logger.info(`Video created: ${video._id}`);

      // Trigger background processing (Fire and Forget)
      this.processingService.processVideo(video._id, tenantId.toString());

      return video;
    } catch (error) {
      if (file && file.key) {
        // Cleanup S3 if DB save fails
        // storageService.deleteFile(file.key);
        // TODO: Implement deleteFile in storage service for cleanup
      }
      throw error;
    }
  }

  async getVideoStream(videoId, tenantId) {
    const video = await this.videoRepository.findById(videoId, tenantId);
    if (!video) {
      throw createError(404, 'Video not found');
    }

    if (video.processingStatus !== 'COMPLETED') {
      throw createError(400, 'Video is still processing');
    }

    // For direct streaming we can return the signed URL
    const videoUrl = await getSignedVideoUrl(video.s3Key);
    return {
      url: videoUrl,
      headers: {
        'Content-Type': video.mimetype,
        'Content-Length': video.size
      }
    };
  }

  async listVideos(tenantId, filters = {}) {
    const query = { tenantId };

    // Filter by processing status if requested
    if (filters.status) {
      query.sensitivityStatus = filters.status;
    }

    // RBAC: If needed we can enable a flag to show all or only user's videos
    // but the requirement says 'listVideos' generally.

    const videos = await this.videoRepository.find(query);
    return videos;
  }
}

export default VideoService;
