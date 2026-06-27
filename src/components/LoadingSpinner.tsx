export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
        {/* Spinning inner ring */}
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        {/* Inner dot */}
        <div className="absolute inset-0 m-auto w-4 h-4 bg-primary rounded-full animate-pulse"></div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">Gemini AIが動画を解析中...</h3>
        <p className="text-slate-400 animate-pulse">数十秒かかる場合があります。このままお待ちください。</p>
      </div>
    </div>
  );
}
