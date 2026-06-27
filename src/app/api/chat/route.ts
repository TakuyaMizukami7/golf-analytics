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
    const systemInstruction = `あなたはプロのゴルフコーチです。
ユーザーから提供されるスイング動画を分析し、良い点、改善点、おすすめの練習ドリルなどを論理的かつ励ますようなトーンで伝えてください。
また、ゴルフの悩み相談に乗ったり、おすすめのゴルフ場を検索して提案することもできます。
ユーザーとの対話は、親しみやすく、専門的なアドバイスを含めて行ってください。
【重要】ゴルフの分析以外の日常会話や質問に対しては、10文字〜200文字程度の短く軽快な回答を心がけてください。

【重要】出力は必ずJSONフォーマットで行ってください。
JSONには以下の構造を含める必要があります。
- chatMessage: ユーザーに表示するマークダウン形式のチャット返答。見やすく装飾してください。
- analysisData: 動画分析を行った場合のみ、このオブジェクトに構造化データを入れてください。ただのチャットの場合は null にしてください。
  - goodPoints: 良い点の配列
  - badPoints: 改善点の配列
  - practiceDrills: おすすめ練習ドリルの配列`;

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

    console.log("Sending request to Gemini...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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

    return NextResponse.json({ 
      content: jsonResponse.chatMessage,
      analysisData: jsonResponse.analysisData || null
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}
