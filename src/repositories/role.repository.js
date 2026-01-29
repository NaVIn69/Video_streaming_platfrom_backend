export default class RoleRepository {
  constructor(roleModel) {
    this.roleModel = roleModel;
  }

  async create(data) {
    return this.roleModel.create(data);
  }

  async findById(id, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.roleModel.findOne(query).exec();
  }

  async findByName(name, tenantId) {
    return this.roleModel.findOne({ name, tenantId }).exec();
  }

  async findByTenant(tenantId) {
    return this.roleModel.find({ tenantId, isActive: true }).exec();
  }

  async updateById(id, data, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.roleModel.findOneAndUpdate(query, data, { new: true }).exec();
  }

  async deleteById(id, tenantId) {
    const query = { _id: id };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return this.roleModel.findOneAndDelete(query).exec();
  }
}
