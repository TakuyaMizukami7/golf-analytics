import { Activity } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <Activity className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Golf <span className="text-primary">AI</span> Analytics
        </h1>
      </div>
    </header>
  );
}
