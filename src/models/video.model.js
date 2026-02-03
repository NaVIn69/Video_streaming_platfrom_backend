import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      required: true
    },
    s3Key: {
      type: String,
      required: true
    },
    bucket: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    duration: {
      type: Number, // In seconds
      default: 0
    },
    sensitivityStatus: {
      type: String,
      enum: ['PENDING', 'SAFE', 'FLAGGED'],
      default: 'PENDING'
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    views: {
      type: Number,
      default: 0
    },
    sensitivityAnalysis: {
      isSafe: Boolean,
      confidence: Number,
      flags: [String],
      summary: String,
      analyzedAt: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
VideoSchema.index({ tenantId: 1, sensitivityStatus: 1 });
VideoSchema.index({ tenantId: 1, createdAt: -1 });

export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
