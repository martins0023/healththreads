// pages/api/media/presign.js

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { getUserFromToken } from "../../../lib/auth";  // we’ll define this in a moment

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate user (stub; replace with your JWT logic)
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Expect ?type=image or video or audio, and client should pass an optional filename
  const { type, filename, mimeType } = req.query;
  if (!type || !["image", "video", "audio", "file"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing media type" });
  }

  // Derive file extension from filename (if provided), otherwise default by type
  let ext = filename?.split(".").pop().toLowerCase();
  if (!ext) {
    ext = {
      image: "png",
      video: "mp4",
      audio: "mp3",
      file: filename?.split(".").pop().toLowerCase() || "bin",
    }[type];
  }

  // Construct a unique S3 key: e.g., public/uploads/userId/uuid.ext
  const key = `public/uploads/${user.id}/${uuidv4()}.${ext}`;

  // Determine content type (MIME) based on extension
  let contentType = mimeType || "";
  if (!contentType) {
    if (type === "image") contentType = `image/${ext}`;
    else if (type === "video") contentType = `video/${ext}`;
    else if (type === "audio") contentType = `audio/${ext}`;
    else contentType = "application/octet-stream";
  }

  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    return res.status(500).json({ error: "Missing S3_BUCKET_NAME" });
  }

  try {
    // Create a presigned PUT command valid for 5 minutes
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      // ContentType: contentType,
      // ACL: "public-read", 
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 300 seconds (5m)

    return res.status(200).json({
      key,
      url: signedUrl,
      publicUrl: `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${key}`,
    });
  } catch (err) {
    console.error("S3 presign error:", err);
    return res.status(500).json({ error: "Failed to generate presigned URL" });
  }
}
