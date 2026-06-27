# Golf AI Analytics - プロジェクト概要

## 1. プロジェクトの目的
ユーザーが撮影した後方からのゴルフスイング動画をAIが解析し、フィードバック（良い点、改善点、練習方法）を提供するWebアプリケーション。
**【アップデート1】** 単なる分析画面から、AIゴルフコーチキャラクターとのチャットを介したUIに進化しました。動画の分析だけでなく、ゴルフの悩み相談や最新のゴルフ場検索などもチャットを通じて行うことができます。
**【アップデート2】** AIコーチ常駐型「パーソナライズ・ダッシュボード」UIに進化しました。初期状態は動画アップロードを促す画面（Empty State）となり、動画解析後はスコアや飛距離グラフ、打点ヒートマップなどのデータと、公開APIを用いた天気予報・ゴルフ日和判定ウィジェットが表示されます。

## 2. 技術スタック
- **フロントエンド・バックエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UIコンポーネント**: `lucide-react` (アイコン), `react-markdown`, `remark-gfm` (チャットメッセージのマークダウン表示)
- **AIモデル**: Google Gemini 3.5 Flash (`@google/genai` SDK)
- **機能拡張**: Google Search Grounding (AIがGoogle検索を用いて最新情報を回答)
- **インフラストラクチャ**: Google Cloud Run
- **ストレージ**: Google Cloud Storage (GCS)

## 3. アーキテクチャと処理フロー
動画ファイルサイズが大きくなることを想定し、Cloud Runのリクエストサイズ制限（32MB）やメモリリークを回避するためのアーキテクチャを採用しています。

1. **チャット入力**: ユーザーがフロントエンド（`ChatUI.tsx`）でAIコーチにメッセージを送信。任意で動画ファイルを添付可能。
2. **アップロードURL発行**: 動画が添付された場合、バックエンド（`/api/upload-url`）へリクエストを送り、GCSの署名付きURL（Signed URL）を取得。
3. **GCSへの直接アップロード（Direct Upload）**: フロントエンドからGCSへ動画ファイルを直接PUTリクエストでアップロード。
4. **チャット・解析リクエスト**: バックエンド（`/api/chat`）へ、チャット履歴とGCS上のオブジェクト名（動画がある場合）を送信。
5. **AI処理・解析**:
   - バックエンドがGCSから一時ファイルとして動画をダウンロード。
   - `Gemini File API` (`ai.files.upload`) を使ってGeminiに動画をアップロード。
   - プロンプト、チャット履歴、および動画を合わせて `gemini-3.5-flash` モデルにリクエスト（`tools: [{ googleSearch: {} }]` を有効化）。
6. **結果返却**: Geminiからの返答をMarkdown形式でフロントエンドに返し、`ChatMessage.tsx` で表示。
7. **クリーンアップ**: 解析完了後、Gemini File API上のファイルや、ローカルの一時ファイルを削除。

## 4. 重要なファイル構成
- `src/app/page.tsx`: メインページ。ダッシュボードとAIコーチを左右（モバイルは上下）に配置する2カラムレイアウトで、`isAnalyzed` 状態を管理。
- `src/components/Dashboard.tsx`: スコア、飛距離グラフ、打点ヒートマップなどのモックデータを表示するダッシュボードコンポーネント。未分析時のEmpty State表示機能や、Open-Meteo APIを用いた天気・ゴルフ日和判定ウィジェットを内包。各データカードクリックでチャットへプロンプトを送信する連携機能を持つ。
- `src/components/ChatUI.tsx`: アプリケーションの右側に常駐するチャット画面のUIコンポーネント。メッセージリスト管理、動画の直接アップロード機能、およびダッシュボードからのトリガーメッセージ送信機能を担う。
- `src/components/ChatMessage.tsx`: ユーザーとAIコーチの吹き出しを表示し、Markdownテキストをレンダリングするコンポーネント。複数種類（5種類）のゴルフコーチのアイコン画像をメッセージ内容に応じて動的に切り替えて表示します。
- `src/app/api/upload-url/route.ts`: GCSの署名付きURL（`v4`）を発行するAPIルート。
- `src/app/api/chat/route.ts`: GCSからのダウンロード、Gemini APIへのファイルアップロード、チャット生成、検索ツールの利用を行う中核API。
- `cors.json`: GCSバケットのCORS設定ファイル。フロントエンドからの直接PUTを許可するために使用。
- `.env.local`: `GEMINI_API_KEY` を保存（Cloud Run環境変数にも設定）。

*(注: 以前の `UploadForm.tsx`、`ResultDisplay.tsx`、`api/analyze/route.ts` の処理は、チャットUIおよび `api/chat/route.ts` に統合されました)*

## 5. Google Cloud 環境設定 (プロジェクトID: mizukami-2b54e)
- **Cloud Run サービス**: `golf-analytics` (`asia-northeast1`)
- **Cloud Storage バケット**: `gs://mizukami-2b54e-golf-videos` (アップロード用、CORS設定済み)
- **IAM権限設定**:
  Cloud Runのデフォルトサービスアカウント (`150582714610-compute@developer.gserviceaccount.com`) に対して以下の権限を付与済み。
  - `roles/storage.admin` (バケットへのアクセス権)
  - `roles/iam.serviceAccountTokenCreator` (署名付きURLを発行するための権限)

## 6. 今後の課題・拡張性
- **動画のクリーンアップ**: 現在、解析後にローカルの一時ファイルやGemini上のファイルは削除しているが、GCS上の動画ファイルは残ったままになっている。不要な場合は定期的に自動削除（ライフサイクルルールの設定など）を検討。
- **モーション生成**: 初期の要件からは除外したが、将来的に「改善された場合のモーション」を生成する機能の追加。
- **エラーハンドリング**: 長時間の動画処理でのタイムアウト対策など。
- **チャット履歴の永続化**: 現在のチャット履歴はブラウザのセッション中のみ保持されるため、データベース（FirestoreやPostgreSQL等）への保存機能の追加。
