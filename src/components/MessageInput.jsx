import { useState } from 'react';
import { sendMessage } from '../services/socket';
import useStore from '../store/useStore';

export default function MessageInput() {
  const [text, setText] = useState('');
  const { user, activeChannel } = useStore();

  function handleSend() {
    if (!text.trim()) return;
    sendMessage({
      channelId:      activeChannel,
      senderId:       user.userId,
      senderUsername: user.username,
      content:        text.trim(),
    });
    setText('');
  }

  return (
    <div className="px-4 py-4 border-t border-[#1e293b] bg-[#080b10]">
      <div className="flex gap-3 items-center bg-[#1e293b] rounded-xl px-4 py-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Message #${activeChannel}`}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
        />
        <button onClick={handleSend}
          disabled={!text.trim()}
          className="text-violet-400 hover:text-violet-300 disabled:text-slate-700 transition-colors text-lg">
          ➤
        </button>
      </div>
      <div className="text-xs text-slate-700 mt-1.5 px-1">
        Press Enter to send
      </div>
    </div>
  );
}