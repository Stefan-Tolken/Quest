import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const s3Res = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
      })
    );
    
    const stream = s3Res.Body as ReadableStream;
    const contentType = s3Res.ContentType || 'image/jpeg';
    
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
        "Cache-Control": "public, max-age=31536000, immutable"
      },
    });
  } catch (err) {
    console.error("Failed to fetch image from S3:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}