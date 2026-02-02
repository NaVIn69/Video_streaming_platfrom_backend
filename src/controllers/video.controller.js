class VideoController {
  constructor(videoService, logger) {
    this.videoService = videoService;
    this.logger = logger;
  }

  upload = async (req, res, next) => {
    try {
      const video = await this.videoService.uploadVideo(req.file, req.body, req.user, req.tenantId);

      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully. Processing started.',
        data: {
          videoId: video._id,
          status: video.processingStatus
        }
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const videos = await this.videoService.listVideos(req.tenantId, req.query);
      res.json({
        success: true,
        data: videos
      });
    } catch (error) {
      next(error);
    }
  };

  stream = async (req, res, next) => {
    try {
      const { id } = req.params;
      const range = req.headers.range;

      // For this implementation, we are redirecting to the signed URL
      // which is efficient and handles range requests automatically by S3.
      // If we wanted to proxy, we would pipe getObject stream here.

      const { url } = await this.videoService.getVideoStream(id, req.tenantId, range);

      // Redirect to S3 Signed URL
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  };
}

export default VideoController;
