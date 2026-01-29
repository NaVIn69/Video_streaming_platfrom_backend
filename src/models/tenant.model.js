import mongoose from 'mongoose';

// here for multitenant architecture we have name of org and their subdomian ,email,
const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      immutable: true
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

TenantSchema.index({ slug: 1 }, { unique: true });

export const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
