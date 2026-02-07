export default class TenantRepository {
  constructor(tenantModel) {
    this.tenantModel = tenantModel;
  }

  async create(data) {
    return this.tenantModel.create(data);
  }

  async findBySlug(slug) {
    return this.tenantModel.findOne({ slug, isActive: true }).exec();
  }

  async findById(id) {
    return this.tenantModel.findById(id).exec();
  }

  async findAll(options = {}) {
    const { page = 1, limit = 10, search } = options;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [tenants, total] = await Promise.all([
      this.tenantModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.tenantModel.countDocuments(query).exec()
    ]);

    return {
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateById(id, data) {
    return this.tenantModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(id) {
    return this.tenantModel.findByIdAndDelete(id).exec();
  }
}
