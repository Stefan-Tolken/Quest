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
  console.log("Fetching 3D model with key:", key , "and Url:  " + request.url);
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
    return new Response(stream, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
        "Cache-Control": "public, max-age=31536000, immutable"
      },
    });
  } catch (err) {
    console.error("Failed to fetch 3D model from S3:", err);
    return NextResponse.json({ error: "Failed to fetch 3D model" }, { status: 500 });
  }
}
