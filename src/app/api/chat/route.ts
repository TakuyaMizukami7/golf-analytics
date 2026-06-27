import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import os from 'os';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Initialize GCS
const storage = new Storage();
const bucketName = 'mizukami-2b54e-golf-videos';

// リトライ処理（Exponential Backoff）用関数
async function generateContentWithRetry(aiClient: any, params: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (error: any) {
      const isOverloaded = error.status === 503 || error.status === 429 || 
        error.message?.includes("503") || error.message?.includes("high demand") || error.message?.includes("UNAVAILABLE");
      
      if (isOverloaded) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s
        console.warn(`Gemini API overloaded. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { messages, objectName } = await req.json();

    let uploadedFileRef = null;

    // GCSから動画を取得してGeminiにアップロード
    if (objectName) {
      console.log(`Processing video: ${objectName}`);
      const tempFilePath = path.join(os.tmpdir(), objectName);
      
      // GCSからダウンロード
      await storage.bucket(bucketName).file(objectName).download({ destination: tempFilePath });
      
      // Gemini File API にアップロード
      console.log("Uploading to Gemini...");
      const uploadResult = await ai.files.upload({
        file: tempFilePath,
        config: {
          mimeType: "video/mp4", // Default to mp4
        }
      });
      console.log("Uploaded to Gemini:", uploadResult.name);

      // 動画の処理完了を待つ (状態が ACTIVE になるまで)
      let fileInfo = await ai.files.get({ name: uploadResult.name! });
      while (fileInfo.state === "PROCESSING") {
        console.log("Waiting for video processing...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        fileInfo = await ai.files.get({ name: uploadResult.name! });
      }

      if (fileInfo.state === "FAILED") {
        throw new Error("Geminiによる動画の処理に失敗しました。");
      }

      uploadedFileRef = fileInfo;
    }

    // チャットのコンテキスト構築
    const systemInstruction = `あなたはプロのゴルフコーチ「Krockshot」です。
ユーザーから提供されるスイング動画を分析し、良い点、改善点、おすすめの練習ドリルなどを論理的かつ励ますようなトーンで伝えてください。
分析の際は、直前のチャット履歴に含まれるユーザーからの回答（クラブの種類、気を付けていること、悩んでいること）を必ず考慮し、寄り添った具体的なアドバイスを行ってください。
また、ゴルフの悩み相談に乗ったり、おすすめのゴルフ場を検索して提案することもできます。天気予報について話題が出た場合は、ゴルフ日和かどうかも合わせてコメントしてください。
ユーザーとの対話は、親しみやすく、専門的なアドバイスを含めて行ってください。
【重要】ゴルフの分析以外の日常会話や質問に対しては、10文字〜200文字程度の短く軽快な回答を心がけてください。

【重要】出力は必ずJSONフォーマットで行ってください。
JSONには以下の構造を含める必要があります。
- chatMessage: ユーザーに表示するマークダウン形式のチャット返答。見やすく装飾してください。
- analysisData: 動画分析を行った場合のみ、このオブジェクトに構造化データを入れてください。ただのチャットの場合は null にしてください。
  - goodPoints: 良い点の配列（必ず1つ以上挙げてください）
  - badPoints: 改善点の配列（必ず1つ以上挙げてください。省略や空配列は許可されません）
  - practiceDrills: おすすめ練習ドリルの配列（必ず1つ以上挙げてください）`;

    const userMessageObj = messages[messages.length - 1];
    
    // 内容の構築
    const contents = [];
    
    // これまでの履歴 (system以外)
    for (let i = 0; i < messages.length - 1; i++) {
        contents.push({
            role: messages[i].role === 'assistant' ? 'model' : 'user',
            parts: [{ text: messages[i].content }]
        });
    }
    
    // 今回のメッセージ（動画があれば追加）
    const currentParts: any[] = [];
    if (uploadedFileRef) {
        currentParts.push({
            fileData: {
                fileUri: uploadedFileRef.uri,
                mimeType: uploadedFileRef.mimeType
            }
        });
        currentParts.push({ text: '上記の動画を分析してください。\n' });
    }
    currentParts.push({ text: userMessageObj.content });

    contents.push({
        role: 'user',
        parts: currentParts
    });

    const targetModel = uploadedFileRef ? 'gemini-3.1-pro-preview' : 'gemini-3.1-flash-lite';

    console.log(`Sending request to Gemini using model: ${targetModel}...`);
    const response = await generateContentWithRetry(ai, {
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            chatMessage: { type: "STRING" },
            analysisData: {
              type: "OBJECT",
              nullable: true,
              properties: {
                goodPoints: { type: "ARRAY", items: { type: "STRING" } },
                badPoints: { type: "ARRAY", items: { type: "STRING" } },
                practiceDrills: { type: "ARRAY", items: { type: "STRING" } }
              }
            }
          },
          required: ["chatMessage"]
        }
      }
    });

    // 解析完了後、Gemini上のファイルを削除（クリーンアップ）
    if (uploadedFileRef) {
        try {
            await ai.files.delete({ name: uploadedFileRef.name! });
            console.log("Deleted file from Gemini:", uploadedFileRef.name);
        } catch (e) {
            console.error("Failed to delete file from Gemini:", e);
        }
    }

    const text = response.text;
    if (!text) {
        throw new Error("Geminiからのレスポンスが空でした。");
    }
    const jsonResponse = JSON.parse(text);

    let normalizedAnalysisData = null;
    if (jsonResponse.analysisData) {
      normalizedAnalysisData = {
        goodPoints: jsonResponse.analysisData.goodPoints || [],
        badPoints: jsonResponse.analysisData.badPoints || [],
        practiceDrills: jsonResponse.analysisData.practiceDrills || []
      };
    }

    return NextResponse.json({ 
      content: jsonResponse.chatMessage,
      analysisData: normalizedAnalysisData
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}
