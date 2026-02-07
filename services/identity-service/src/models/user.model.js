import mongoose from 'mongoose';
import { hash } from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },

    email: {
      type: String,
      required: true,
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

    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],

    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    lastLoginAt: { type: Date },

    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
/*
{ tenantId: 1, email: 1 }: This defines the "Compound" part. It tells MongoDB to create an index using two fields: tenantId and email. The 1 signifies an ascending sort order for both.
{ unique: true }: This enforces the "Unique" constraint. Unlike a standard unique index on just email, this ensures the combination of the two fields is unique across the collection.
*/

UserSchema.virtual('fullName').get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(' ');
});

/**
.virtual("fullName"): Declares a new property named fullName that can be accessed like any other field (e.g., user.fullName), but it is never saved to the database.

 */
UserSchema.pre('save', async function () {
  // when password is hashed previously then we call the next middleware
  if (!this.isModified('passwordHash')) {
    return;
  }
  // if password is modified then it return true
  this.passwordHash = await hash(this.passwordHash, 10);
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
