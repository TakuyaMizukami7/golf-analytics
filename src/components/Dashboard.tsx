"use client";

import { useState, useEffect } from "react";
import { Activity, Target, BarChart3, TrendingUp, AlertCircle, Maximize2, Sun, CloudRain, Cloud } from "lucide-react";

interface DashboardProps {
  onTopicClick: (prompt: string) => void;
  isAnalyzed: boolean;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number, description: string, isGoodForGolf: boolean, code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 東京の天気予報（今日のデータ）
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
    <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 px-4 py-2 rounded-xl backdrop-blur-sm">
      <div className={`p-2 rounded-lg ${weather.isGoodForGolf ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
        {weather.code >= 50 ? <CloudRain className="w-5 h-5" /> : (weather.code > 0 ? <Cloud className="w-5 h-5" /> : <Sun className="w-5 h-5" />)}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-white">関東 (今日)</span>
          <span className="text-xs text-slate-300">{weather.temp}°C {weather.description}</span>
        </div>
        <span className={`text-xs font-medium ${weather.isGoodForGolf ? 'text-emerald-400' : 'text-rose-400'}`}>
          {weather.isGoodForGolf ? '絶好のゴルフ日和です⛳️' : 'あいにくの天気です☔️'}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ onTopicClick, isAnalyzed }: DashboardProps) {
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

      {/* Content Area with Empty State handling */}
      <div className="relative flex-1 flex flex-col gap-6">
        
        {/* Empty State Overlay */}
        {!isAnalyzed && (
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

        {/* Summary Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-700 ${!isAnalyzed ? 'opacity-30 pointer-events-none select-none blur-sm' : ''}`}>
          <div 
            className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all hover:bg-white/5 group"
            onClick={() => onTopicClick("最近の平均スコア（88）について、さらにスコアを縮めるためのアドバイスをください。")}
          >
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">平均スコア</span>
            </div>
            <div className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">88</div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>-2 from last month</span>
            </div>
          </div>

          <div 
            className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-white/5 group"
            onClick={() => onTopicClick("フェアウェイキープ率（62%）について分析して。ティーショットの安定性を高めたいです。")}
          >
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">FWキープ率</span>
            </div>
            <div className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">62<span className="text-lg text-slate-400">%</span></div>
            <div className="text-xs text-slate-400 mt-1">
              Target: 65%
            </div>
          </div>

          <div 
            className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-purple-500/50 cursor-pointer transition-all hover:bg-white/5 group"
            onClick={() => onTopicClick("平均パット数（34）について、パッティングの改善方法を教えて。")}
          >
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <div className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              </div>
              <span className="text-sm font-medium">平均パット</span>
            </div>
            <div className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">34</div>
            <div className="text-xs text-slate-400 mt-1">
              +1 from last month
            </div>
          </div>

          <div 
            className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-rose-500/50 cursor-pointer transition-all hover:bg-white/5 group"
            onClick={() => onTopicClick("ミスの傾向について。スライスのミスが多い原因と対策を教えてください。")}
          >
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium">主なミス</span>
            </div>
            <div className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors mt-1">スライス</div>
            <div className="text-xs text-rose-400 mt-1">
              右へのプッシュアウト傾向
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6 transition-opacity duration-700 ${!isAnalyzed ? 'opacity-30 pointer-events-none select-none blur-sm' : ''}`}>
          
          {/* Distance Graph Mock */}
          <div 
            className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 cursor-pointer transition-all group flex flex-col min-h-[300px]"
            onClick={() => onTopicClick("番手別の飛距離データを見ているんだけど、7番アイアン（150y）と6番アイアン（155y）の飛距離差があまりない理由と解決策は？")}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">番手別飛距離 (Yards)</h3>
              </div>
              <Maximize2 className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-2 mt-4 px-2 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-b border-white h-0"></div>
                <div className="border-b border-white h-0"></div>
                <div className="border-b border-white h-0"></div>
                <div className="border-b border-white h-0"></div>
                <div className="border-b border-white h-0"></div>
              </div>

              {/* Bar Chart Mock */}
              {[
                { club: 'Dr', dist: 245, h: '95%' },
                { club: '3W', dist: 220, h: '85%' },
                { club: '5W', dist: 205, h: '78%' },
                { club: '5I', dist: 175, h: '65%' },
                { club: '6I', dist: 155, h: '55%' },
                { club: '7I', dist: 150, h: '53%' }, 
                { club: '8I', dist: 140, h: '45%' },
                { club: '9I', dist: 125, h: '35%' },
                { club: 'PW', dist: 110, h: '25%' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group/bar z-10">
                  <div className="text-xs text-slate-300 font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity absolute -mt-6">
                    {item.dist}
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-t-sm flex items-end justify-center relative h-40">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 ${i === 4 || i === 5 ? 'bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500/60 group-hover/bar:bg-emerald-400'}`}
                      style={{ height: item.h }}
                    />
                  </div>
                  <div className="text-xs font-medium text-slate-400">{item.club}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-slate-500 text-center flex items-center justify-center gap-2 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-rose-200">6番・7番アイアンの飛距離差が少ないため、AIに改善策を聞いてみましょう</span>
            </div>
          </div>

          {/* Heatmap / Skeleton Mock */}
          <div 
            className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-cyan-500/30 cursor-pointer transition-all group flex flex-col min-h-[300px]"
            onClick={() => onTopicClick("ドライバーの打点ヒートマップを見ると、ヒール側に当たることが多いです。スイング軌道の改善方法を教えてください。")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">打点ヒートマップ (Driver)</h3>
              </div>
              <Maximize2 className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 flex items-center justify-center relative min-h-[180px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
               {/* Club Face Mock */}
              <div className="w-48 h-32 border-2 border-slate-600 rounded-[40%] bg-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner">
                {/* Score lines */}
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 opacity-30">
                  <div className="w-2/3 h-[1px] bg-white"></div>
                  <div className="w-3/4 h-[1px] bg-white"></div>
                  <div className="w-3/4 h-[1px] bg-white"></div>
                  <div className="w-3/4 h-[1px] bg-white"></div>
                  <div className="w-2/3 h-[1px] bg-white"></div>
                </div>
                
                {/* Heatmap Blob (Heel side biased) */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 bg-rose-500/80 rounded-full blur-2xl mix-blend-screen"></div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-400/90 rounded-full blur-xl mix-blend-screen"></div>
                <div className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full blur-md"></div>
                
                {/* Sweet spot indicator */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/30 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-xs text-slate-500 text-center flex items-center justify-center gap-2 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-200">ヒール寄りに打点が集中しています。クリックしてAIの分析を見る</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
