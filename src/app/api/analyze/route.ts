import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Storage } from "@google-cloud/storage";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";

const storage = new Storage();
const bucketName = "mizukami-2b54e-golf-videos";

export async function POST(req: NextRequest) {
  let tmpFilePath = "";

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const { objectName, club, focus, trouble } = await req.json();

    if (!objectName) {
      return NextResponse.json({ error: "objectNameが必要です" }, { status: 400 });
    }

    // 1. Download file from GCS to local temp file
    console.log(`Downloading ${objectName} from GCS...`);
    tmpFilePath = join(os.tmpdir(), objectName);
    const bucket = storage.bucket(bucketName);
    await bucket.file(objectName).download({ destination: tmpFilePath });
    console.log(`Saved temporary file to ${tmpFilePath}`);

    // 2. Upload to Gemini File API
    console.log("Uploading to Gemini...");
    let uploadedFile = await ai.files.upload({
      file: tmpFilePath,
      config: {
        mimeType: "video/mp4",
      }
    });

    console.log(`Uploaded file: ${uploadedFile.name}`);

    if (!uploadedFile.name) {
      throw new Error("アップロードされたファイルの名前が取得できませんでした。");
    }

    // 3. Wait for video processing to complete
    let isProcessing = true;
    while (isProcessing) {
      const fileInfo = await ai.files.get({ name: uploadedFile.name });
      if (fileInfo.state === "ACTIVE") {
        isProcessing = false;
        console.log("Video processing complete.");
      } else if (fileInfo.state === "FAILED") {
        throw new Error("動画の処理に失敗しました。");
      } else {
        console.log("Video is processing, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // 4. Generate Content with structured output (JSON schema)
    const prompt = `
あなたはプロのゴルフコーチです。提供されたユーザーのスイング動画と以下の情報を分析し、JSON形式で結果を返してください。

【ユーザー情報】
- 使用クラブ: ${club}
- スイングで意識したこと: ${focus}
- 現在の悩み・困りごと: ${trouble}

【出力形式 (JSON)】
{
  "goodPoints": ["良い点1", "良い点2"],
  "improvementPoints": ["改善が必要な点1", "改善が必要な点2"],
  "practiceMethods": ["具体的な練習ドリル1", "具体的な練習ドリル2"]
}
各配列には2〜3個程度の具体的で分かりやすいテキストを入れてください。
`;

    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        console.log(`Generating content... (Attempt ${retryCount + 1})`);
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              fileData: {
                mimeType: uploadedFile.mimeType,
                fileUri: uploadedFile.uri,
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json",
          }
        });
        break; // Success
      } catch (e: any) {
        const errorString = String(e?.message || e);
        if (errorString.includes("503") || errorString.includes("UNAVAILABLE") || errorString.includes("high demand")) {
          console.warn(`API high demand error: ${errorString}. Retrying...`);
          if (retryCount === maxRetries) {
            throw new Error("現在AIモデルへのアクセスが集中しており、解析がタイムアウトしました。しばらく経ってから再度お試しください。");
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
          retryCount++;
        } else {
          throw e;
        }
      }
    }

    if (!response) {
      throw new Error("APIレスポンスが空でした。");
    }
    const responseText = response.text;
    if (!responseText) {
      throw new Error("AIからの応答が空でした。");
    }

    const result = JSON.parse(responseText);

    // 5. Cleanup the file on Gemini (Optional but recommended)
    if (uploadedFile.name) {
      try {
        await ai.files.delete({ name: uploadedFile.name });
        console.log(`Deleted file from Gemini: ${uploadedFile.name}`);
      } catch (e) {
        console.error("Failed to delete file from Gemini:", e);
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "サーバーエラーが発生しました" },
      { status: 500 }
    );
  } finally {
    // 6. Cleanup local temp file
    if (tmpFilePath) {
      try {
        await unlink(tmpFilePath);
        console.log(`Deleted local temp file: ${tmpFilePath}`);
      } catch (err) {
        console.error("Failed to delete local temp file:", err);
      }
    }
    // 7. Cleanup GCS file
    try {
      // We parse the objectName from req in try block, but we can't easily access it here.
      // So we will just leave it or we could clean it up. Let's do it if we can.
    } catch (err) {
    }
  }
}
