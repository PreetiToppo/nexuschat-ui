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

  // Load history + connect WebSocket when channel changes
  useEffect(() => {
    if (!user) return;

    // Load message history
    chatAPI.getMessages(activeChannel).then((res) => {
      setMessages([...res.data].reverse());
    }).catch(console.error);

    // Connect WebSocket
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

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
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