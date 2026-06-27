import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

// Initialize GCS client
// Ensure the Cloud Run service account has Storage Admin or Object Admin permissions
const storage = new Storage();
const bucketName = "mizukami-2b54e-golf-videos";

export async function POST(req: NextRequest) {
  try {
    const { contentType, extension } = await req.json();

    if (!contentType) {
      return NextResponse.json({ error: "ContentType is required" }, { status: 400 });
    }

    const objectName = `upload-${uuidv4()}${extension || ".mp4"}`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    // Generate a Signed URL for uploading
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return NextResponse.json({ uploadUrl, objectName });
  } catch (error: any) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "アップロード用URLの生成に失敗しました" },
      { status: 500 }
    );
  }
}
