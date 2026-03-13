import { useState, useCallback } from 'react';
import { sendMessage } from '../services/socket';
import useStore from '../store/useStore';
import SuggestionBar from '../components/SuggestionBar';

export default function MessageInput() {
  const [text, setText]               = useState('');
  const [showSuggestions, setShow]    = useState(false);
  const { user, activeChannel }       = useStore();

  function handleSend(content) {
    const msg = (content ?? text).trim();
    if (!msg) return;
    sendMessage({
      channelId:      activeChannel,
      senderId:       user.userId,
      senderUsername: user.username,
      content:        msg,
    });
    setText('');
    setShow(false);
  }

  // When user picks a suggestion, fill the input OR send directly
  // Here we send directly — remove this and just setText(s) if you prefer
  function handleSuggestionSelect(suggestion) {
    handleSend(suggestion);
  }

  // Show suggestions when input is focused (and it's empty or short)
  function handleFocus() {
    setShow(true);
  }

  // Hide suggestions when input blurs (small delay so clicks register)
  function handleBlur() {
    setTimeout(() => setShow(false), 150);
  }

  return (
    <div className="border-t border-[#1e293b] bg-[#080b10]">
      {/* AI suggestion bar sits above the input */}
      <SuggestionBar
        channelId={activeChannel}
        onSelect={handleSuggestionSelect}
        visible={showSuggestions}
      />

      <div className="px-4 pb-4">
        <div className="flex gap-3 items-center bg-[#1e293b] rounded-xl px-4 py-2.5">
          {/* AI sparkle icon — click to toggle suggestions */}
          <button
            onClick={() => setShow(v => !v)}
            className={`text-base transition-colors flex-shrink-0 ${
              showSuggestions
                ? 'text-violet-400'
                : 'text-slate-600 hover:text-slate-400'
            }`}
            title="AI reply suggestions"
          >
            ✦
          </button>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={`Message #${activeChannel}`}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!text.trim()}
            className="text-violet-400 hover:text-violet-300 disabled:text-slate-700 transition-colors text-lg"
          >
            ➤
          </button>
        </div>
        <div className="text-xs text-slate-700 mt-1.5 px-1 flex items-center gap-2">
          <span>Press Enter to send</span>
          <span>·</span>
          <span className="text-slate-700">
            ✦ AI suggestions {showSuggestions ? 'on' : 'off'}
          </span>
        </div>
      </div>
    </div>
  );
}