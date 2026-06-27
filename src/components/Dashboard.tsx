"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Activity, Target, BarChart3, TrendingUp, AlertCircle, Maximize2, Sun, CloudRain, Cloud, CheckCircle2, XCircle, Dumbbell } from "lucide-react";
import { AnalysisData } from "@/types";

interface DashboardProps {
  onTopicClick: (prompt: string) => void;
  analysisData: AnalysisData | null;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number, description: string, isGoodForGolf: boolean, code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&daily=weathercode,temperature_2m_max&timezone=Asia%2FTokyo&forecast_days=1");
        const data = await res.json();
        
        const code = data.daily.weathercode[0];
        const maxTemp = data.daily.temperature_2m_max[0];
        
        let desc = "晴れ";
        let isGood = true;
        
        if (code >= 50) {
          desc = "雨/悪天候";
          isGood = false;
        } else if (code >= 1 && code <= 3) {
          desc = "曇り";
        }
        
        setWeather({ temp: maxTemp, description: desc, isGoodForGolf: isGood, code });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return <div className="h-12 w-48 animate-pulse bg-slate-800 rounded-xl"></div>;
  }

  if (!weather) return null;

  return (
    <div className="flex items-center gap-3">
      {/* キャラクターアイコン */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-lg shrink-0 bg-slate-800">
        <Image 
          src="/image/golf-coach3.png" 
          alt="AI Coach" 
          fill 
          className="object-cover"
        />
      </div>
      
      {/* 吹き出し風ウィジェット */}
      <div className="flex flex-col bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl rounded-tl-sm backdrop-blur-sm shadow-md">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-bold text-slate-200">関東 (今日)</span>
          <span className="text-[10px] text-slate-400">{weather.temp}°C {weather.description}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {weather.code >= 50 ? <CloudRain className="w-3.5 h-3.5 text-rose-400" /> : (weather.code > 0 ? <Cloud className="w-3.5 h-3.5 text-slate-300" /> : <Sun className="w-3.5 h-3.5 text-emerald-400" />)}
          <span className={`text-xs font-bold ${weather.isGoodForGolf ? 'text-emerald-400' : 'text-rose-400'}`}>
            {weather.isGoodForGolf ? '絶好のゴルフ日和ですね⛳️' : 'あいにくの天気ですね☔️'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onTopicClick, analysisData }: DashboardProps) {
  return (
    <div className="flex flex-col h-full w-full gap-6 p-4 md:p-6 overflow-y-auto no-scrollbar relative">
      
      {/* Header & Weather */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Your Golf Dashboard</h2>
          <p className="text-slate-400 text-sm">最新のデータに基づいたパーソナライズされた分析</p>
        </div>
        <WeatherWidget />
      </div>

      {/* Content Area */}
      <div className="relative flex-1 flex flex-col gap-6">
        
        {/* Empty State Overlay */}
        {!analysisData && (
          <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5">
            <div className="bg-slate-800/90 p-8 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col items-center text-center max-w-sm w-full">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">動画分析しよう！</h3>
              <p className="text-slate-300 text-sm mb-2 leading-relaxed">
                右側のAIコーチにスイング動画を送信して、<br/>
                分析を開始してください⛳️
              </p>
            </div>
          </div>
        )}

        {/* 実際の分析結果が表示されるUI */}
        {analysisData && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Good Points */}
            <div 
              className="glass-panel p-6 rounded-2xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all cursor-pointer group"
              onClick={() => onTopicClick("良い点として挙げてもらった部分について、さらに伸ばすための意識の仕方を教えてください。")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">良い点 (Good Points)</h3>
              </div>
              <ul className="space-y-3">
                {analysisData.goodPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-200">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bad Points */}
            <div 
              className="glass-panel p-6 rounded-2xl border border-rose-500/30 hover:border-rose-400/50 transition-all cursor-pointer group"
              onClick={() => onTopicClick("改善点として指摘された部分について、具体的にコースで気を付けるべきことは何ですか？")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/20 rounded-lg">
                  <XCircle className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors">改善点 (Needs Improvement)</h3>
              </div>
              <ul className="space-y-3">
                {analysisData.badPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-200">
                    <span className="text-rose-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practice Drills */}
            <div 
              className="glass-panel p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all cursor-pointer group"
              onClick={() => onTopicClick("提案してくれた練習ドリルを自宅でもできるアレンジ方法はありますか？")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Dumbbell className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">おすすめ練習ドリル (Practice Drills)</h3>
              </div>
              <ul className="space-y-3">
                {analysisData.practiceDrills.map((drill, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-200 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <span className="text-cyan-400 font-bold">{i + 1}.</span>
                    <span>{drill}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* モックグラフ（未分析時のみぼかして表示） */}
        {!analysisData && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6 opacity-30 pointer-events-none select-none blur-sm">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 min-h-[300px]">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">番手別飛距離 (Yards)</h3>
              </div>
              {/* Dummy Bars */}
              <div className="flex-1 flex items-end justify-between gap-2 mt-4 px-2 relative h-40">
                 {[95, 85, 78, 65, 55, 53, 45, 35, 25].map((h, i) => (
                   <div key={i} className="w-full bg-slate-800/50 rounded-t-sm flex items-end justify-center h-full">
                     <div className="w-full bg-emerald-500/60 rounded-t-sm" style={{ height: `${h}%` }} />
                   </div>
                 ))}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 min-h-[300px]">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">打点ヒートマップ</h3>
              </div>
              <div className="flex-1 flex items-center justify-center relative min-h-[180px] bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="w-48 h-32 border-2 border-slate-600 rounded-[40%] bg-slate-800 relative">
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 bg-rose-500/80 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
