export default class UserRepository {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async create(data) {
    return this.userModel.create(data);
  }

  async findByEmail(email, tenantId) {
    return this.userModel.findOne({ email, tenantId }).populate('roles').exec();
  }

  async findById(id, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.userModel.findOne(query).populate('roles').exec();
  }

  async findByTenant(tenantId, options = {}) {
    const { page = 1, limit = 10, search } = options;
    const query = { tenantId };

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .populate('roles')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(query).exec()
    ]);

    return {
      users,
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
    return this.userModel.findOneAndUpdate(query, data, { new: true }).populate('roles').exec();
  }

  async deleteById(id, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.userModel.findOneAndDelete(query).exec();
  }

  async updateLastLogin(id) {
    return this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() }, { new: true }).exec();
  }

  async deleteByTenantId(tenantId) {
    return this.userModel.deleteMany({ tenantId }).exec();
  }
}
