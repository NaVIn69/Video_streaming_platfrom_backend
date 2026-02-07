import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      enum: ['viewer', 'editor', 'admin'],
      lowercase: true
    },
    permissions: {
      videos: {
        view: { type: Boolean, default: false },
        upload: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      users: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      tenants: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique role name per tenant
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Set default permissions based on role name
RoleSchema.pre('save', function () {
  if (this.isNew) {
    switch (this.name) {
      case 'viewer':
        this.permissions = {
          videos: { view: true, upload: false, edit: false, delete: false },
          users: { view: false, create: false, edit: false, delete: false },
          tenants: { view: false, manage: false }
        };
        break;
      case 'editor':
        this.permissions = {
          videos: { view: true, upload: true, edit: true, delete: true },
          users: { view: false, create: false, edit: false, delete: false },
          tenants: { view: false, manage: false }
        };
        break;
      case 'admin':
        this.permissions = {
          videos: { view: true, upload: true, edit: true, delete: true },
          users: { view: true, create: true, edit: true, delete: true },
          tenants: { view: true, manage: true }
        };
        break;
    }
  }
});

export const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
