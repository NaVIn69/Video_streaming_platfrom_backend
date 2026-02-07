import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3.js';
import { Config } from '../config/index.js';

export const getSignedVideoUrl = async key => {
  const command = new GetObjectCommand({
    Bucket: Config.AWS.BUCKET_NAME,
    Key: key
  });

  // URL expires in 2 hours
  return getSignedUrl(s3Client, command, { expiresIn: 7200 });
};

export const deleteS3Object = async key => {
  const command = new DeleteObjectCommand({
    Bucket: Config.AWS.BUCKET_NAME,
    Key: key
  });
  return s3Client.send(command);
};
