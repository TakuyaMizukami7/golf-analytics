"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage, { Message } from "./ChatMessage";
import { AnalysisData } from "@/types";

interface ChatUIProps {
  triggerMessage?: string;
  onMessageTriggered?: () => void;
  onAnalysisComplete?: (data: AnalysisData) => void;
}

export default function ChatUI({ triggerMessage, onMessageTriggered, onAnalysisComplete }: ChatUIProps = {}) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'こんにちは！ゴルフコーチのKrockshotです。⛳️\nスイング動画をアップロードして「分析して」と伝えてもらうか、ゴルフの悩み、おすすめのゴルフ場など何でも聞いてください！' 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [isWaitingForHearing, setIsWaitingForHearing] = useState(false);
  
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
    // ヒアリングフェーズ: 動画が添付され、まだ質問していない場合
    if (attachedFile && !isWaitingForHearing) {
      setPendingVideo(attachedFile);
      setIsWaitingForHearing(true);
      
      const newMessages: Message[] = [
        ...messages, 
        { role: 'user', content: text.trim() || "動画をアップロードしました。" },
        { role: 'assistant', content: '動画を受け付けました！⛳️\n分析をより正確に行うため、以下の3点を教えてください。\n\n1. **クラブの種類**（例：7番アイアン、ドライバーなど）\n2. **気を付けていること**（例：頭を残す、ゆっくり振るなど）\n3. **悩んでいること**（例：スライスが出る、ダフるなど）' }
      ];
      setMessages(newMessages);
      setInput("");
      clearFile();
      return;
    }

    let fileToProcess = attachedFile;
    if (isWaitingForHearing) {
      fileToProcess = pendingVideo || attachedFile;
      setIsWaitingForHearing(false);
      setPendingVideo(null);
    }

    const userMessage = text.trim() || (fileToProcess ? "回答を送信しました。" : "");
    if (!userMessage && !fileToProcess) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      let objectName = null;

      // 動画がある場合は先にアップロード
      if (fileToProcess) {
        setMessages(prev => [...prev, { role: 'assistant', content: '動画をアップロード中です... ⏳' }]);
        
        const ext = fileToProcess.name.substring(fileToProcess.name.lastIndexOf("."));
        const res = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: fileToProcess.type, extension: ext }),
        });

        if (!res.ok) throw new Error("アップロードURLの取得に失敗しました");
        const urlData = await res.json();
        
        const uploadRes = await fetch(urlData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": fileToProcess.type },
          body: fileToProcess,
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
        if (fileToProcess) {
          clean = prev.slice(0, prev.length - 1);
        }
        return [...clean, { role: 'assistant', content: chatData.content }];
      });
      
      // 送信完了したらファイルクリア
      clearFile();

      // 解析完了（分析データが返ってきた場合）
      if (chatData.analysisData && onAnalysisComplete) {
        onAnalysisComplete(chatData.analysisData);
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => {
        let clean = prev;
        if (fileToProcess) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <aside className="w-full h-full border-l border-outline-variant bg-surface flex flex-col rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 md:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <h3 className="font-headline-md text-base font-bold text-on-surface">Krockshot</h3>
        </div>
        <button className="text-on-surface-variant hover:text-primary transition-all">
          <span className="material-symbols-outlined text-xl">history</span>
        </button>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-lowest relative">
        {preview && (
          <div className="mb-4 relative inline-block animate-in fade-in slide-in-from-bottom-2">
            <div className="relative rounded-xl overflow-hidden bg-black/50 h-24 aspect-video flex items-center justify-center border border-primary/30 shadow-lg">
              <video src={preview} className="max-h-full" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-1 right-1 bg-black/60 hover:bg-error text-white p-1 rounded-full backdrop-blur-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 pl-4 pr-[3.5rem] text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none resize-none transition-all min-h-[5rem] max-h-32" 
            placeholder="Ask your coach..."
          />
          <div className="absolute right-3 bottom-3 flex flex-col gap-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !!preview || isWaitingForHearing}
              className="p-1.5 bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-all disabled:opacity-50 flex items-center justify-center"
              title="添付ファイルを追加"
            >
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              type="submit"
              disabled={isLoading || (!input.trim() && !file)}
              className="p-1.5 bg-primary text-on-primary rounded-lg hover:brightness-110 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              )}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-on-surface-variant mt-2 text-center">AI Coach may provide technical suggestions. Consult a PGA pro for physical safety.</p>
      </div>
    </aside>
  );
}
