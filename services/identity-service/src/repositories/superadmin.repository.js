export default class SuperAdminRepository {
  constructor(superAdminModel) {
    this.superAdminModel = superAdminModel;
  }

  async create(data) {
    return this.superAdminModel.create(data);
  }

  async findByEmail(email) {
    return this.superAdminModel.findOne({ email }).exec();
  }

  async findById(id) {
    return this.superAdminModel.findById(id).exec();
  }

  async updateLastLogin(id) {
    return this.superAdminModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() }, { new: true })
      .exec();
  }
}
