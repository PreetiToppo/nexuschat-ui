import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useStore from '../store/useStore';

export default function MessageList() {
  const messages = useStore((s) => s.messages);
  const user     = useStore((s) => s.user);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-700 text-sm">
        No messages yet — say hello! 👋
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg, i) => {
        const isMe = msg.senderId === user?.userId ||
                     msg.senderUsername === user?.username;
        const time = msg.createdAt
          ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })
          : 'just now';

        return (
          <div key={msg.id || i}
            className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
              {msg.senderUsername?.[0]?.toUpperCase()}
            </div>
            {/* Bubble */}
            <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs font-medium text-slate-300">
                  {msg.senderUsername}
                </span>
                <span className="text-xs text-slate-600">{time}</span>
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                ${isMe
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-[#1e293b] text-slate-200 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}