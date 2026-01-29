export default class VideoRepository {
  constructor(videoModel) {
    this.videoModel = videoModel;
  }

  async create(data) {
    return this.videoModel.create(data);
  }

  async findById(id, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.videoModel.findOne(query).populate('uploadedBy', 'email firstName lastName').exec();
  }

  async findByTenant(tenantId, options = {}) {
    const { page = 1, limit = 10, search, status, isSafe, uploadedBy } = options;

    const query = { tenantId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (isSafe !== undefined) {
      query['sensitivityAnalysis.isSafe'] = isSafe;
    }

    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      this.videoModel
        .find(query)
        .populate('uploadedBy', 'email firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.videoModel.countDocuments(query).exec()
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

  async updateById(id, data, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.videoModel
      .findOneAndUpdate(query, data, { new: true })
      .populate('uploadedBy', 'email firstName lastName')
      .exec();
  }

  async deleteById(id, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.videoModel.findOneAndDelete(query).exec();
  }

  async updateProcessingProgress(id, progress, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.videoModel
      .findOneAndUpdate(query, { processingProgress: progress }, { new: true })
      .exec();
  }

  async updateStatus(id, status, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.videoModel.findOneAndUpdate(query, { status }, { new: true }).exec();
  }
}
