import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env.js';

const regionBuckets = {
  'ap-south-1': process.env.AWS_S3_BUCKET_AP_SOUTH_1,
  'us-east-1': process.env.AWS_S3_BUCKET_US_EAST_1,
  'eu-central-1': process.env.AWS_S3_BUCKET_EU_CENTRAL_1,
  'eu-west-2': process.env.AWS_S3_BUCKET_EU_WEST_2,
  'me-south-1': process.env.AWS_S3_BUCKET_ME_SOUTH_1
};

const clients = new Map();

function getClient(region) {
  if (!clients.has(region)) {
    clients.set(
      region,
      new S3Client({
        region,
        credentials: {
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey
        }
      })
    );
  }
  return clients.get(region);
}

export function resolveBucket(region) {
  return regionBuckets[region] || env.awsBucketDefault;
}

export async function uploadBufferToS3({ region, key, buffer, contentType }) {
  const bucket = resolveBucket(region);
  const client = getClient(region);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
