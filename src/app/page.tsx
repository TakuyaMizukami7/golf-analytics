"use client";

import { useState } from "react";
import ChatUI from "@/components/ChatUI";
import Dashboard from "@/components/Dashboard";
import { AnalysisData } from "@/types";

export default function Home() {
  const [triggerMessage, setTriggerMessage] = useState<string>("");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleTopicClick = (prompt: string) => {
    setTriggerMessage(prompt);
  };

  const handleMessageTriggered = () => {
    setTriggerMessage("");
  };

  const handleAnalysisComplete = (data: AnalysisData) => {
    setAnalysisData(data);
  };

  const toggleDebug = () => {
    if (analysisData) {
      setAnalysisData(null);
    } else {
      setAnalysisData({
        goodPoints: ["アドレスの姿勢が非常に美しく、安定感があります。", "トップオブスイングでのクラブフェースの向きが理想的です。"],
        badPoints: ["ダウンスイングで体が早く開いてしまい、振り遅れの原因になっています。", "インパクト時に重心が右足に残りがちです。"],
        practiceDrills: ["右足ベタ足スイング: インパクトまで右足のかかとを浮かせないドリル", "両脇にタオルを挟んだハーフスイング練習"]
      });
    }
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
              checked={!!analysisData}
              onChange={toggleDebug}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${analysisData ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${analysisData ? 'transform translate-x-4' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* 2カラムレイアウト: LG以上で左右分割、それ未満は上下分割 */}
      <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden mt-10 md:mt-0">
        
        {/* 左側: ダッシュボード */}
        <div className="flex-1 lg:flex-[2.5] h-full overflow-hidden">
          <Dashboard onTopicClick={handleTopicClick} analysisData={analysisData} />
        </div>

        {/* 右側: チャットUI */}
        <div className="flex-1 lg:min-w-[360px] xl:max-w-md h-[600px] lg:h-full shrink-0 relative">
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
