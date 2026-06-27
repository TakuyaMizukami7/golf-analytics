import { useState, useEffect } from "react";
import Image from "next/image";
import { AnalysisData } from "@/types";

interface DashboardProps {
  onTopicClick?: (topic: string) => void;
  analysisData: AnalysisData | null;
}

export default function Dashboard({ onTopicClick, analysisData }: DashboardProps) {
  // Weather state
  const [weather, setWeather] = useState<{ temp: number; description: string; isGoodForGolf: boolean; code: number; loaded: boolean }>({
    temp: 0,
    description: "",
    isGoodForGolf: true,
    code: 0,
    loaded: false
  });

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
        
        setWeather({ temp: maxTemp, description: desc, isGoodForGolf: isGood, code, loaded: true });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="flex-1 p-2 md:p-6 space-y-card-gap overflow-y-auto w-full h-full text-on-surface">
      {/* Dashboard Header & Weather */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display-lg text-3xl md:text-display-lg text-on-surface tracking-tight">Golf Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">最新のデータに基づいたパーソナライズされた分析</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* キャラクターアイコン */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/30 shadow-lg shrink-0 bg-slate-800">
            <Image src="/image/golf-coach3.png" alt="AI Coach" fill className="object-cover" />
          </div>
          
          {/* 吹き出し風ウィジェット */}
          <div className="flex flex-col bg-surface-container-high border border-outline-variant px-4 py-2 rounded-2xl rounded-tl-sm shadow-md relative ml-2">
            {/* 吹き出しの尻尾 */}
            <div className="absolute top-4 -left-2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-outline-variant"></div>
            <div className="absolute top-[17px] -left-[7px] w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-surface-container-high"></div>
            
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xs font-bold text-on-surface">関東 (今日)</span>
              <span className="text-[10px] text-on-surface-variant">
                {weather.loaded ? `${weather.temp}°C ${weather.description}` : "取得中..."}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {weather.loaded && (
                <span className="material-symbols-outlined text-[14px]">
                  {weather.code >= 50 ? 'rainy' : (weather.code > 0 ? 'cloud' : 'sunny')}
                </span>
              )}
              <span className={`text-xs font-bold ${weather.loaded ? (weather.isGoodForGolf ? 'text-primary' : 'text-error') : 'text-on-surface-variant'}`}>
                {weather.loaded ? (weather.isGoodForGolf ? 'Krockshot「絶好のゴルフ日和ですね⛳️」' : 'Krockshot「あいにくの天気ですね☔️」') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-card-gap">
        
        {/* Good Points */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-primary bg-surface-container-low shadow-lg">
          <div className="flex items-center gap-2 text-primary mb-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h3 className="font-bold tracking-tight text-lg">良い点 (Good Points)</h3>
          </div>
          <ul className="space-y-3">
            {(!analysisData || analysisData.goodPoints.length === 0) ? (
              <li className="flex flex-col">
                <span className="font-body-md text-on-surface-variant italic">分析結果待ち...</span>
              </li>
            ) : (
              analysisData.goodPoints.map((point, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-caption text-on-surface-variant uppercase text-[10px] tracking-widest">POINT {i + 1}</span>
                  <span className="font-body-md font-semibold text-on-surface">{point}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Needs Improvement */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-tertiary bg-surface-container-low shadow-lg">
          <div className="flex items-center gap-2 text-tertiary mb-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            <h3 className="font-bold tracking-tight text-lg">改善点 (Needs Fix)</h3>
          </div>
          <ul className="space-y-3">
            {(!analysisData || analysisData.badPoints.length === 0) ? (
              <li className="flex flex-col">
                <span className="font-body-md text-on-surface-variant italic">分析結果待ち...</span>
              </li>
            ) : (
              analysisData.badPoints.map((point, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-caption text-on-surface-variant uppercase text-[10px] tracking-widest">ISSUE {i + 1}</span>
                  <span className="font-body-md font-semibold text-on-surface">{point}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Practice Drills */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-secondary bg-surface-container-low shadow-lg">
          <div className="flex items-center gap-2 text-secondary mb-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
            <h3 className="font-bold tracking-tight text-lg">練習ドリル (Drills)</h3>
          </div>
          <ul className="space-y-3">
            {(!analysisData || analysisData.practiceDrills.length === 0) ? (
              <li className="flex flex-col">
                <span className="font-body-md text-on-surface-variant italic">分析結果待ち...</span>
              </li>
            ) : (
              analysisData.practiceDrills.map((drill, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-caption text-on-surface-variant uppercase text-[10px] tracking-widest">DRILL {i + 1}</span>
                  <span className="font-body-md font-semibold text-on-surface">{drill}</span>
                </li>
              ))
            )}
          </ul>
        </div>

      </div>

      {/* Data Visuals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Bar Chart: Distance by Club */}
        <div className="glass-panel p-6 rounded-xl flex flex-col bg-surface-container-low shadow-lg relative overflow-hidden">
          {!analysisData && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center border border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">analytics</span>
              <p className="text-on-surface-variant font-medium">動画を分析してデータを確認</p>
            </div>
          )}
          <div className={`transition-opacity duration-500 ${!analysisData ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-md text-lg font-bold">Distance by Club</h3>
              <span className="font-data-label text-xs text-on-surface-variant">AVG YARDS</span>
            </div>
            <div className="flex-1 flex items-end gap-4 h-48 px-2">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 border-t-2 border-primary rounded-t-sm inner-glow" style={{ height: "90%", transition: "height 1s ease" }}></div>
                <span className="font-data-label text-[10px] text-on-surface-variant">DRIVER</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 border-t-2 border-primary/60 rounded-t-sm inner-glow" style={{ height: "75%", transition: "height 1s ease" }}></div>
                <span className="font-data-label text-[10px] text-on-surface-variant">3W</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 border-t-2 border-primary/40 rounded-t-sm inner-glow" style={{ height: "60%", transition: "height 1s ease" }}></div>
                <span className="font-data-label text-[10px] text-on-surface-variant">5i</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 border-t-2 border-primary/30 rounded-t-sm inner-glow" style={{ height: "50%", transition: "height 1s ease" }}></div>
                <span className="font-data-label text-[10px] text-on-surface-variant">7i</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 border-t-2 border-primary/20 rounded-t-sm inner-glow" style={{ height: "35%", transition: "height 1s ease" }}></div>
                <span className="font-data-label text-[10px] text-on-surface-variant">PW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap: Driver Impact Pattern */}
        <div className="glass-panel p-6 rounded-xl relative bg-surface-container-low shadow-lg overflow-hidden">
          {!analysisData && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center border border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">radar</span>
              <p className="text-on-surface-variant font-medium">動画を分析してインパクトを確認</p>
            </div>
          )}
          <div className={`transition-opacity duration-500 ${!analysisData ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-headline-md text-lg font-bold">Driver Impact Pattern</h3>
              <div className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-[10px] text-primary font-bold">CENTERED 84%</div>
            </div>
            <div className="relative w-full aspect-square max-h-[220px] mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border border-outline-variant rounded-xl flex items-center justify-center opacity-20">
                <div className="w-full h-[1px] bg-outline-variant"></div>
                <div className="h-full w-[1px] bg-outline-variant absolute"></div>
              </div>
              <div className="relative w-48 h-32 border-2 border-outline-variant rounded-[40%] flex items-center justify-center bg-surface-container-highest/50">
                <div className="w-16 h-10 bg-primary/40 rounded-full blur-xl animate-pulse"></div>
                <div className="w-8 h-6 bg-primary/60 rounded-full blur-md absolute"></div>
                <div className="absolute top-4 right-8 w-2 h-2 bg-primary/40 rounded-full"></div>
                <div className="absolute bottom-6 left-12 w-1.5 h-1.5 bg-primary/30 rounded-full"></div>
                <div className="absolute top-12 left-6 w-2 h-2 bg-primary/20 rounded-full"></div>
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 font-data-label text-[10px] text-on-surface-variant">TOE</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-data-label text-[10px] text-on-surface-variant">HEEL</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 font-data-label text-[10px] text-on-surface-variant -rotate-90">CROWN</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 font-data-label text-[10px] text-on-surface-variant rotate-90">SOLE</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
