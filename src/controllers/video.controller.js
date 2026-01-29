export default class VideoController {
  constructor(videoService, logger) {
    this.videoService = videoService;
    this.logger = logger;

    this.upload = this.upload.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.stream = this.stream.bind(this);
  }

  async upload(req, res, next) {
    try {
      if (!req.file) {
        return next(new Error('No video file provided'));
      }

      const video = await this.videoService.uploadVideo(
        req.file,
        {
          title: req.body.title || req.file.originalname,
          description: req.body.description || ''
        },
        req.userId,
        req.tenantId
      );

      this.logger.info(`Video uploaded: ${video._id}`);
      res.status(201).json({
        success: true,
        data: video
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        status: req.query.status,
        isSafe: req.query.isSafe !== undefined ? req.query.isSafe === 'true' : undefined,
        uploadedBy: req.query.uploadedBy
      };

      const result = await this.videoService.getVideos(req.tenantId, options);
      res.json({
        success: true,
        data: result.videos,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const video = await this.videoService.getVideoById(req.params.id, req.tenantId);
      res.json({
        success: true,
        data: video
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const video = await this.videoService.updateVideo(req.params.id, req.body, req.tenantId);
      this.logger.info(`Video updated: ${req.params.id}`);
      res.json({
        success: true,
        data: video
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await this.videoService.deleteVideo(req.params.id, req.tenantId);
      this.logger.info(`Video deleted: ${req.params.id}`);
      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async stream(req, res, next) {
    try {
      const range = req.headers.range;
      const streamData = await this.videoService.getVideoStream(req.params.id, req.tenantId, range);

      const video = await this.videoService.getVideoById(req.params.id, req.tenantId);

      if (range) {
        // Partial content
        res.status(206);
        res.setHeader(
          'Content-Range',
          `bytes ${streamData.start}-${streamData.end}/${streamData.fileSize}`
        );
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', streamData.chunksize);
        res.setHeader('Content-Type', video.mimeType);
        res.send(streamData.buffer);
      } else {
        // Full content
        res.setHeader('Content-Length', streamData.fileSize);
        res.setHeader('Content-Type', video.mimeType);
        res.send(streamData.buffer);
      }
    } catch (err) {
      next(err);
    }
  }
}
