import mongoose from 'mongoose';

const SuperAdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    passwordHash: {
      type: String,
      required: true
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const SuperAdmin =
  mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);
