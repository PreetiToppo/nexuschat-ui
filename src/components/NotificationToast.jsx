import { useEffect } from 'react';
import useStore from '../store/useStore';

const CHANNELS = ['general', 'engineering', 'design', 'random'];

// Channel accent colors
const CHANNEL_COLORS = {
  general:     { bg: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/40', dot: 'bg-violet-400' },
  engineering: { bg: 'from-cyan-500/20 to-cyan-600/10',    border: 'border-cyan-500/40',    dot: 'bg-cyan-400'    },
  design:      { bg: 'from-pink-500/20 to-pink-600/10',    border: 'border-pink-500/40',    dot: 'bg-pink-400'    },
  random:      { bg: 'from-amber-500/20 to-amber-600/10',  border: 'border-amber-500/40',   dot: 'bg-amber-400'   },
};

function Toast({ notification, onDismiss }) {
  const { setActiveChannel } = useStore();
  const colors = CHANNEL_COLORS[notification.channelId] || CHANNEL_COLORS.general;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 4000);
    return () => clearTimeout(timer);
  }, [notification.id]);

  function handleClick() {
    setActiveChannel(notification.channelId);
    onDismiss(notification.id);
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex items-start gap-3 w-80 cursor-pointer
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        backdrop-blur-xl rounded-2xl px-4 py-3
        shadow-2xl shadow-black/40
        animate-slide-in
        hover:scale-[1.02] transition-transform duration-150
      `}
      style={{
        animation: 'slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${colors.dot}`} />

      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-xl flex items-center justify-center
        text-xs font-bold text-white flex-shrink-0 mt-0.5
        ${colors.dot} bg-opacity-30
      `}
        style={{ background: 'rgba(255,255,255,0.1)' }}>
        {notification.senderUsername?.[0]?.toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white">
            {notification.senderUsername}
          </span>
          <span className="text-xs text-slate-500">in</span>
          <span className={`text-xs font-medium ${
            colors.dot.replace('bg-', 'text-')
          }`}>
            #{notification.channelId}
          </span>
        </div>
        <p className="text-xs text-slate-300 truncate leading-relaxed">
          {notification.content}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
        className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5 text-sm"
      >
        ✕
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.dot} opacity-60`}
          style={{ animation: 'shrink 4s linear forwards' }}
        />
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, removeNotification } = useStore();

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.8); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>

      {/* Toast container — bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
        {notifications.map((n) => (
          <Toast
            key={n.id}
            notification={n}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </>
  );
}