import useStore from '../store/useStore';
import PresenceDot from './PresenceDot';

const CHANNELS = ['general', 'engineering', 'design', 'random'];

export default function Sidebar({ onLogout }) {
  const { user, activeChannel, setActiveChannel, onlineUsers, unreadCounts } = useStore();

  return (
    <div className="w-60 bg-[#080b10] border-r border-[#1e293b] flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">⚡</span>
          <span className="font-bold text-white text-sm">NexusChat</span>
        </div>
        <div className="flex items-center gap-2">
          <PresenceDot online={true} />
          <span className="text-xs text-slate-400">{user?.username}</span>
        </div>
      </div>

      {/* Channels */}
      <div className="px-3 py-3 flex-1 overflow-y-auto">
        <div className="text-xs text-slate-600 px-2 mb-2 tracking-wider">CHANNELS</div>
        {CHANNELS.map((ch) => {
          const unread  = unreadCounts[ch] || 0;
          const isActive = activeChannel === ch;

          return (
            <button key={ch} onClick={() => setActiveChannel(ch)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                flex items-center justify-between group
                ${isActive
                  ? 'bg-violet-600/20 text-violet-300 font-medium'
                  : unread > 0
                    ? 'text-white font-semibold hover:bg-[#1e293b]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]'
                }`}>
              <span className="flex items-center gap-1.5">
                {/* Unread indicator dot */}
                {unread > 0 && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                )}
                {!unread && !isActive && (
                  <span className="w-1.5 h-1.5 flex-shrink-0" /> 
                )}
                # {ch}
              </span>

              {/* Unread count badge */}
              {unread > 0 && !isActive && (
                <span className="
                  bg-violet-500 text-white text-[10px] font-bold
                  rounded-full min-w-[18px] h-[18px]
                  flex items-center justify-center px-1
                ">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}

        {/* Online Users */}
        <div className="text-xs text-slate-600 px-2 mt-5 mb-2 tracking-wider">
          ONLINE — {Object.keys(onlineUsers).length}
        </div>
        {Object.entries(onlineUsers).map(([uid, uname]) => (
          <div key={uid} className="flex items-center gap-2 px-3 py-1.5">
            <PresenceDot online={true} />
            <span className="text-xs text-slate-400">{uname}</span>
          </div>
        ))}
        {Object.keys(onlineUsers).length === 0 && (
          <div className="px-3 text-xs text-slate-700">No one online</div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1e293b]">
        <button onClick={onLogout}
          className="text-xs text-slate-600 hover:text-red-400 transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
}