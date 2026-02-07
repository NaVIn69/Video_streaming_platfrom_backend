import createError from 'http-errors';
import { getSignedVideoUrl } from '@video-stream/shared';

class VideoService {
  constructor(videoRepository, logger) {
    this.videoRepository = videoRepository;
    this.logger = logger;
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
}

export default VideoService;
