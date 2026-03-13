import { useEffect } from 'react';
import { chatAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import useStore from '../store/useStore';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

export default function ChatPage() {
  const {
    user, activeChannel, logout,
    addMessage, setMessages,
    setUserOnline, setUserOffline,
  } = useStore();

  useEffect(() => {
    if (!user) return;

    // 1. Load message history
    chatAPI.getMessages(activeChannel).then((res) => {
      setMessages([...res.data].reverse());
    }).catch(console.error);

    // 2. Load EXISTING online users first ─────────────────── ← added
    chatAPI.getPresence(activeChannel).then((res) => {
      const onlineUsers = res.data; // { userId: username, ... }
      Object.entries(onlineUsers).forEach(([uid, uname]) => {
        setUserOnline(uid, uname);
      });
    }).catch(console.error);

    // 3. Connect WebSocket — listen for future presence changes
    const socket = connectSocket({
      userId:    user.userId,
      username:  user.username,
      channelId: activeChannel,
      onMessage: (msg) => addMessage(msg),
      onPresence: (event) => {
        if (event.status === 'ONLINE') {
          setUserOnline(event.userId, event.username);
        } else {
          setUserOffline(event.userId);
        }
      },
    });

    return () => {
      disconnectSocket({
        userId:    user.userId,
        username:  user.username,
        channelId: activeChannel,
      });
    };
  }, [activeChannel, user]);

  function handleLogout() {
    disconnectSocket({
      userId:    user.userId,
      username:  user.username,
      channelId: activeChannel,
    });
    logout();
  }

  return (
    <div className="flex h-screen bg-[#050508]">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#080b10] flex items-center gap-3">
          <span className="text-slate-400 font-medium">#</span>
          <span className="font-semibold text-white">{activeChannel}</span>
          <span className="text-xs text-slate-600 ml-auto">
            Redis Pub/Sub · MongoDB · WebSocket
          </span>
        </div>

        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
}