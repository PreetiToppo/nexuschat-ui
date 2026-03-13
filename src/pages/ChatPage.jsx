import { useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { connectSocket, disconnectSocket, switchChannel } from '../services/socket';
import useStore from '../store/useStore';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import NotificationToast from '../components/NotificationToast';

export default function ChatPage() {
  const {
    user, activeChannel, logout,
    addMessage, setMessages,
    setUserOnline, setUserOffline,
    incrementUnread, addNotification,
  } = useStore();

  const connectedRef    = useRef(false);
  const activeChannelRef = useRef(activeChannel); // ← track active channel in ref

  // Keep ref in sync with state
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // ── Connect WebSocket ONCE on login ───────────────────────────────
  useEffect(() => {
    if (!user || connectedRef.current) return;

    setUserOnline(user.userId, user.username);

    chatAPI.getAllOnlineUsers().then((res) => {
      Object.entries(res.data).forEach(([uid, uname]) => {
        setUserOnline(uid, uname);
      });
    }).catch(console.error);

    connectSocket({
      userId:   user.userId,
      username: user.username,
      channelId: activeChannel,

      onMessage: (msg) => {
        const currentChannel = activeChannelRef.current;

        if (msg.channelId === currentChannel) {
          // ── Message is in active channel — just add it ─────────
          addMessage(msg);
        } else {
          // ── Message is in background channel ───────────────────
          // Increment unread badge on sidebar
          incrementUnread(msg.channelId);

          // Show toast notification
          addNotification({
            channelId:      msg.channelId,
            senderUsername: msg.senderUsername,
            content:        msg.content,
          });
        }
      },

      onPresence: (event) => {
        if (event.status === 'ONLINE') {
          setUserOnline(event.userId, event.username);
        } else {
          setUserOffline(event.userId);
        }
      },
    });

    connectedRef.current = true;

    return () => {
      disconnectSocket({
        userId:   user.userId,
        username: user.username,
        channelId: activeChannel,
      });
      connectedRef.current = false;
    };
  }, [user]);

  // ── Switch channel subscription ────────────────────────────────────
  useEffect(() => {
    if (!user || !connectedRef.current) return;

    chatAPI.getMessages(activeChannel).then((res) => {
      setMessages([...res.data].reverse());
    }).catch(console.error);

    switchChannel(activeChannel);
  }, [activeChannel]);

  function handleLogout() {
    disconnectSocket({
      userId:   user.userId,
      username: user.username,
      channelId: activeChannel,
    });
    connectedRef.current = false;
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

      {/* Toast notifications — rendered outside main layout */}
      <NotificationToast />
    </div>
  );
}