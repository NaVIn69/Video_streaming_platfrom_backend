class VideoController {
  constructor(videoService, logger) {
    this.videoService = videoService;
    this.logger = logger;
  }

  stream = async (req, res, next) => {
    try {
      const { id } = req.params;
      const range = req.headers.range;

      // For this implementation, we are redirecting to the signed URL
      // which is efficient and handles range requests automatically by S3.
      // If we wanted to proxy, we would pipe getObject stream here.

      // Directly implement service logic here or keep service separate
      // Assuming this.videoService.getVideoStream exists
      const { url } = await this.videoService.getVideoStream(id, req.tenantId, range);

      // Redirect to S3 Signed URL
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  };
}

export default VideoController;
