"use client";

import { useState, useRef } from "react";
import { UploadCloud, Video, X } from "lucide-react";

interface UploadFormProps {
  onSubmit: (data: { objectName: string; club: string; focus: string; trouble: string }) => void;
  isLoading: boolean;
}

export default function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setUploadProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploadProgress("アップロード準備中...");
      const formData = new FormData(e.currentTarget);
      const club = formData.get("club") as string;
      const focus = formData.get("focus") as string;
      const trouble = formData.get("trouble") as string;

      // 1. Get Signed URL
      const ext = file.name.substring(file.name.lastIndexOf("."));
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, extension: ext }),
      });

      if (!res.ok) {
        throw new Error("アップロードURLの取得に失敗しました");
      }

      const { uploadUrl, objectName } = await res.json();

      // 2. Upload directly to GCS
      setUploadProgress("動画をアップロード中...");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("動画のアップロードに失敗しました");
      }

      setUploadProgress("AIが解析中...");
      // 3. Trigger Analysis
      onSubmit({ objectName, club, focus, trouble });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "エラーが発生しました");
      setUploadProgress("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      {/* Video Upload Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl">
        <label className="block text-sm font-medium text-slate-300 mb-2">スイング動画</label>
        
        {!preview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all group"
          >
            <div className="bg-slate-800 p-4 rounded-full group-hover:bg-primary/20 transition-colors mb-4">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium text-slate-200">動画をアップロード</p>
            <p className="text-xs text-slate-500 mt-1">MP4, MOV, WEBM (最大 100MB)</p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video flex items-center justify-center border border-white/10">
            <video src={preview} className="max-h-full" controls />
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <input 
          type="file" 
          accept="video/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          required
        />
      </div>

      {/* Metadata Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div>
          <label htmlFor="club" className="block text-sm font-medium text-slate-300 mb-2">使用クラブ</label>
          <input
            type="text"
            id="club"
            name="club"
            placeholder="例: 7番アイアン、ドライバー"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="focus" className="block text-sm font-medium text-slate-300 mb-2">意識したこと</label>
          <textarea
            id="focus"
            name="focus"
            rows={2}
            placeholder="例: テイクバックで右肘を引かないようにした"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            required
          />
        </div>

        <div>
          <label htmlFor="trouble" className="block text-sm font-medium text-slate-300 mb-2">困りごと・悩み</label>
          <textarea
            id="trouble"
            name="trouble"
            rows={2}
            placeholder="例: スライスが直らない、ダフリが多い"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || isLoading}
        className="w-full bg-gradient-to-r from-primary to-emerald-400 text-slate-900 font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {uploadProgress ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            <span>{uploadProgress}</span>
          </>
        ) : isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            <span>AIが分析中...</span>
          </>
        ) : (
          <>
            <Video className="w-5 h-5" />
            <span>スイングを分析する</span>
          </>
        )}
      </button>
    </form>
  );
}
