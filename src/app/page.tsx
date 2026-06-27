"use client";

import { useState } from "react";
import ChatUI from "@/components/ChatUI";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [triggerMessage, setTriggerMessage] = useState<string>("");
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);

  const handleTopicClick = (prompt: string) => {
    setTriggerMessage(prompt);
  };

  const handleMessageTriggered = () => {
    setTriggerMessage("");
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzed(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full relative">
      
      {/* デバッグ用トグルスイッチ */}
      <div className="absolute top-2 right-4 z-50 md:-top-10 md:right-4">
        <label className="flex items-center cursor-pointer bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-sm shadow-lg hover:bg-slate-700 transition-colors">
          <span className="text-xs text-slate-300 mr-2 font-medium">デバッグ: 分析完了</span>
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isAnalyzed}
              onChange={() => setIsAnalyzed(!isAnalyzed)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${isAnalyzed ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAnalyzed ? 'transform translate-x-4' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* 2カラムレイアウト: LG以上で左右分割、それ未満は上下分割 */}
      <div className="flex flex-col lg:flex-row h-full w-full gap-4 px-2 md:px-6 pb-6 overflow-hidden mt-10 md:mt-0 pt-2">
        
        {/* 左側: ダッシュボード */}
        <div className="flex-[2] lg:flex-[2.5] h-full overflow-hidden rounded-2xl glass-panel border border-white/5 bg-slate-900/30">
          <Dashboard onTopicClick={handleTopicClick} isAnalyzed={isAnalyzed} />
        </div>

        {/* 右側: チャットUI */}
        <div className="flex-1 lg:min-w-[360px] xl:max-w-md h-[600px] lg:h-full shrink-0">
          <ChatUI 
            triggerMessage={triggerMessage} 
            onMessageTriggered={handleMessageTriggered} 
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>

      </div>
    </div>
  );
}
