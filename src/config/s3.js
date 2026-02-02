import { S3Client } from '@aws-sdk/client-s3';
import { Config } from './index.js';

const s3Client = new S3Client({
  region: Config.AWS.REGION,
  credentials: {
    accessKeyId: Config.AWS.ACCESS_KEY_ID,
    secretAccessKey: Config.AWS.SECRET_ACCESS_KEY
  }
});

export default s3Client;
