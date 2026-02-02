import multer from 'multer';
import multerS3 from 'multer-s3';
import createError from 'http-errors';

class StorageService {
  constructor(s3Client, bucketName, config) {
    this.s3 = s3Client;
    this.bucket = bucketName;
    this.config = config; // access to MAX_FILE_SIZE, ALLOWED_MIME_TYPES
  }

  getUploadMiddleware() {
    const bucket = this.config.AWS.BUCKET_NAME;
    if (!bucket) {
      throw new Error('StorageService: Check your .env file, AWS_BUCKET_NAME is undefined!');
    }

    return multer({
      storage: multerS3({
        s3: this.s3,
        bucket,
        metadata: (req, file, cb) => {
          cb(null, {
            fieldName: file.fieldname,
            originalName: file.originalname,
            uploadedBy: req.user._id.toString(),
            tenantId: req.tenantId.toString()
          });
        },
        key: (req, file, cb) => {
          const tenantId = req.tenantId.toString();
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = file.originalname.split('.').pop();
          // Organized storage: video/{tenantId}/{timestamp}-{random}.{ext}
          const key = `videos/${tenantId}/${uniqueSuffix}.${extension}`;
          cb(null, key);
        }
      }),
      limits: {
        fileSize: this.config.MAX_FILE_SIZE
      },
      fileFilter: (req, file, cb) => {
        if (this.config.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(createError(400, 'Invalid file type. Only video files are allowed.'), false);
        }
      }
    });
  }

  async getFileStream() {
    // This will be used for proxy streaming if needed
    // implementation pending depending on specific stream architecture choice
  }
}

export default StorageService;
