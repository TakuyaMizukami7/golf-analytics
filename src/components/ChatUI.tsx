"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import ChatMessage, { Message } from "./ChatMessage";

interface ChatUIProps {
  triggerMessage?: string;
  onMessageTriggered?: () => void;
  onAnalysisComplete?: () => void;
}

export default function ChatUI({ triggerMessage, onMessageTriggered, onAnalysisComplete }: ChatUIProps = {}) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'こんにちは！AIゴルフコーチです。⛳️\nスイング動画をアップロードして「分析して」と伝えてもらうか、ゴルフの悩み、おすすめのゴルフ場など何でも聞いてください！' 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (triggerMessage) {
      sendMessage(triggerMessage, null);
      if (onMessageTriggered) {
        onMessageTriggered();
      }
    }
  }, [triggerMessage]);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (text: string, attachedFile: File | null) => {
    const userMessage = text.trim() || (attachedFile ? "動画を送信しました。" : "");
    if (!userMessage && !attachedFile) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      let objectName = null;

      // 動画がある場合は先にアップロード
      if (attachedFile) {
        setMessages(prev => [...prev, { role: 'assistant', content: '動画をアップロード中です... ⏳' }]);
        
        const ext = attachedFile.name.substring(attachedFile.name.lastIndexOf("."));
        const res = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: attachedFile.type, extension: ext }),
        });

        if (!res.ok) throw new Error("アップロードURLの取得に失敗しました");
        const urlData = await res.json();
        
        const uploadRes = await fetch(urlData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": attachedFile.type },
          body: attachedFile,
        });

        if (!uploadRes.ok) throw new Error("動画のアップロードに失敗しました");
        
        objectName = urlData.objectName;
        
        // アップロード完了メッセージは削除して、分析中メッセージに変更
        setMessages(prev => {
          const m = [...prev];
          m.pop();
          return [...m, { role: 'assistant', content: 'アップロード完了！動画を解析しています... 👀' }];
        });
      }

      // 履歴を送る（アップロード中の仮メッセージ等は除く）
      const history = newMessages.filter(m => m.role === 'user' || m.role === 'assistant');
      
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          objectName: objectName
        })
      });

      if (!chatRes.ok) {
        const errorData = await chatRes.json();
        throw new Error(errorData.error || "チャットの取得に失敗しました");
      }

      const chatData = await chatRes.json();
      
      // 仮メッセージを取り除く
      setMessages(prev => {
        let clean = prev;
        if (attachedFile) {
          clean = prev.slice(0, prev.length - 1);
        }
        return [...clean, { role: 'assistant', content: chatData.content }];
      });
      
      // 送信完了したらファイルクリア
      clearFile();

      // 解析完了（動画添付があった場合）
      if (attachedFile && onAnalysisComplete) {
        onAnalysisComplete();
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => {
        let clean = prev;
        if (attachedFile) {
          clean = prev.slice(0, prev.length - 1);
        }
        return [...clean, { role: 'assistant', content: `エラーが発生しました: ${error.message}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    await sendMessage(input, file);
  };

  return (
    <div className="flex flex-col h-full w-full glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-slate-900/50">
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/40">
        <div className="flex flex-col justify-end min-h-full">
          {messages.map((m, i) => (
            <ChatMessage key={i} message={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md">
        {preview && (
          <div className="mb-4 relative inline-block animate-in fade-in slide-in-from-bottom-2">
            <div className="relative rounded-xl overflow-hidden bg-black/50 h-24 md:h-32 aspect-video flex items-center justify-center border border-white/10 shadow-lg">
              <video src={preview} className="max-h-full" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !!preview}
            className="p-3 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
            title="動画を添付"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="コーチにメッセージを送信..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none max-h-32 mb-1"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !file)}
            className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-1 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>
    </div>
  );
}
