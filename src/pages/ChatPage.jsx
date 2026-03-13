import { useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { connectSocket, disconnectSocket, switchChannel } from '../services/socket';
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

  const connectedRef    = useRef(false); // ← track if socket is connected
  const subscriptionRef = useRef(null);  // ← track current channel subscription

  // ── Connect WebSocket ONCE on login ───────────────────────────────
  useEffect(() => {
    if (!user || connectedRef.current) return;

    // Mark current user online immediately
    setUserOnline(user.userId, user.username);

    // Fetch all online users
    chatAPI.getAllOnlineUsers().then((res) => {
      Object.entries(res.data).forEach(([uid, uname]) => {
        setUserOnline(uid, uname);
      });
    }).catch(console.error);

    // Connect socket ONCE
    connectSocket({
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
      onConnected: (subscribeFn) => {
        // Store the subscribe function so we can reuse it on channel switch
        subscriptionRef.current = subscribeFn;
      },
    });

    connectedRef.current = true;

    return () => {
      disconnectSocket({
        userId:    user.userId,
        username:  user.username,
        channelId: activeChannel,
      });
      connectedRef.current = false;
    };
  }, [user]); // ← only runs ONCE on login

  // ── Switch channel subscription when activeChannel changes ────────
  useEffect(() => {
    if (!user || !connectedRef.current) return;

    // Load message history for new channel
    chatAPI.getMessages(activeChannel).then((res) => {
      setMessages([...res.data].reverse());
    }).catch(console.error);

    // Switch channel subscription without reconnecting
    switchChannel(activeChannel);

  }, [activeChannel]); // ← runs on every channel switch

  function handleLogout() {
    disconnectSocket({
      userId:    user.userId,
      username:  user.username,
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
    </div>
  );
}