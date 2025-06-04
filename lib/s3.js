// lib/s3.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;

// Create S3 client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a pre-signed PUT URL for a given key and contentType.
 * @param {string} key – The path/filename (e.g. “posts/1234abcd.jpg”).
 * @param {string} contentType – MIME type (e.g. “image/jpeg”).
 * @param {number} expiresIn – TTL in seconds (default: 300s).
 */
export async function generatePresignedUrl(key, contentType, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read", // makes the uploaded file publicly readable
  });
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  // The final public URL will be: https://{bucket}.s3.{region}.amazonaws.com/{key}
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { signedUrl, publicUrl };
}
