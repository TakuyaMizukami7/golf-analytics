import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User } from 'lucide-react';
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
  const coachId = getCoachImageId(message.content);

  return (
    <div className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 relative rounded-full overflow-hidden border border-emerald-500/30 shadow-lg flex items-center justify-center bg-slate-800">
          <Image src={`/image/golf-coach${coachId}.png`} alt="AI Golf Coach" fill className="object-cover" />
        </div>
      )}
      
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 ${
        isUser 
          ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-900 rounded-br-none shadow-lg' 
          : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700 rounded-bl-none shadow-xl'
      }`}>
        {isUser ? (
          <div className="whitespace-pre-wrap font-medium">{message.content}</div>
        ) : (
          <div className="markdown-body text-sm md:text-base leading-relaxed [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:text-emerald-400 [&>strong]:text-emerald-300 [&>strong]:font-semibold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-slate-700 border border-slate-600 text-slate-300 rounded-full flex items-center justify-center shadow-lg">
          <User size={20} />
        </div>
      )}
    </div>
  );
}
