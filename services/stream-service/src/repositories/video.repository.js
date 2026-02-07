class VideoRepository {
  constructor(model) {
    this.model = model;
  }

  async create(videoData) {
    const video = await this.model.create(videoData);
    return video;
  }

  async findById(id, tenantId) {
    return this.model.findOne({ _id: id, tenantId });
  }

  async find(query, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('uploader', 'firstName lastName email'),
      this.model.countDocuments(query)
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  async updateProcessingOutcome(videoId, tenantId, data) {
    return this.model.findOneAndUpdate({ _id: videoId, tenantId }, { $set: data }, { new: true });
  }
}

export default VideoRepository;
