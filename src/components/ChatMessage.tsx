import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const getCoachImageId = (content: string) => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = content.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 5) + 1;
};

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col gap-2 items-end ml-auto max-w-[90%] w-full mb-4">
        <div className="flex items-center gap-2 justify-end">
          <span className="font-data-label text-[10px] uppercase text-on-surface-variant">You</span>
        </div>
        <div className="bg-secondary-container text-on-secondary-container p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  const coachId = getCoachImageId(message.content);

  return (
    <div className="flex flex-col gap-2 max-w-[95%] w-full mb-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 relative rounded-full overflow-hidden border border-emerald-500/30 bg-slate-800">
          <Image src={`/image/golf-coach${coachId}.png`} alt="Krockshot" fill className="object-cover" />
        </div>
        <span className="font-data-label text-[10px] uppercase text-on-surface-variant">Krockshot</span>
      </div>
      <div className="bg-surface-container-high border-l-2 border-primary p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm leading-relaxed space-y-3 shadow-md overflow-hidden">
        <div className="prose prose-invert prose-emerald prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
