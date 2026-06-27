import { CheckCircle2, TrendingUp, Dumbbell } from "lucide-react";

interface ResultData {
  goodPoints: string[];
  improvementPoints: string[];
  practiceMethods: string[];
}

interface ResultDisplayProps {
  result: ResultData | null;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI 分析結果</h2>
        <p className="text-slate-400">あなたのスイングの客観的な評価と改善プランです</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 良い点 */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-emerald-50">良い点</h3>
          </div>
          <ul className="space-y-3">
            {result.goodPoints.map((point, index) => (
              <li key={index} className="flex gap-3 text-slate-300">
                <span className="text-emerald-500 shrink-0 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 改善点 */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-amber-50">改善が必要な点</h3>
          </div>
          <ul className="space-y-3">
            {result.improvementPoints.map((point, index) => (
              <li key={index} className="flex gap-3 text-slate-300">
                <span className="text-amber-500 shrink-0 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 練習方法 */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden mt-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <Dumbbell className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-white">おすすめの練習方法（ドリル）</h3>
        </div>
        <ul className="space-y-4">
          {result.practiceMethods.map((method, index) => (
            <li key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="text-slate-300 mt-1 leading-relaxed">
                  {method}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
