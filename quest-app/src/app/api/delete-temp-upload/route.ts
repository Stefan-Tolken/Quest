import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: "Missing file key" }, { status: 400 });
    }

    console.log('🗑️ Deleting temporary upload:', key);

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    await s3.send(command);
    
    console.log('✅ Temporary upload deleted successfully:', key);

    return NextResponse.json({
      success: true,
      message: "Temporary upload deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting temporary upload:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete temporary upload",
        details: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
}