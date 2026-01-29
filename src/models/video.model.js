import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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
    originalFilename: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    duration: {
      type: Number // in seconds
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'completed', 'failed', 'flagged'],
      default: 'uploading',
      index: true
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    sensitivityAnalysis: {
      isSafe: {
        type: Boolean,
        default: null
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100
      },
      flags: [
        {
          type: String
        }
      ],
      analyzedAt: {
        type: Date
      }
    },
    metadata: {
      width: Number,
      height: Number,
      bitrate: Number,
      codec: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for efficient queries
VideoSchema.index({ tenantId: 1, status: 1 });
VideoSchema.index({ tenantId: 1, uploadedBy: 1 });
VideoSchema.index({ tenantId: 1, createdAt: -1 });
VideoSchema.index({ tenantId: 1, 'sensitivityAnalysis.isSafe': 1 });

export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
