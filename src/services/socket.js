import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import useStore from '../store/useStore';

const CHANNELS = ['general', 'engineering', 'design', 'random'];

let client             = null;
let heartbeatTimer     = null;
let isConnecting       = false;
let currentSubscription = null;
let messageHandler     = null;
let presenceHandler    = null;

export function connectSocket({ userId, username, channelId, onMessage, onPresence }) {
  if (isConnecting) return client;

  if (client) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    isConnecting   = false;
    try { client.deactivate(); } catch (e) {}
    client = null;
  }

  messageHandler  = onMessage;
  presenceHandler = onPresence;

  const accessToken = useStore.getState().accessToken;
  isConnecting      = true;

  client = new Client({
    webSocketFactory: () => new SockJS('https://nexuschat-server-production.up.railway.app/ws'),
    connectHeaders: {
      userId,
      username,
      Authorization: `Bearer ${accessToken}`,
    },
    reconnectDelay: 5000,

    onConnect: () => {
      isConnecting = false;
      console.log('✅ WebSocket connected');

      if (!client?.connected) return;

      // ── Subscribe to ALL channels at once ──────────────────────────
      CHANNELS.forEach((ch) => {
        client.subscribe(`/topic/channel/${ch}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            if (data.eventType === 'MESSAGE') {
              messageHandler?.(data);   // ← pass ALL messages to handler
            }
          } catch (e) {
            console.error('Failed to parse message', e);
          }
        });
        console.log(`📡 Subscribed to #${ch}`);
      });

      // Subscribe to presence
      client.subscribe('/topic/presence', (msg) => {
        try {
          const data = JSON.parse(msg.body);
          presenceHandler?.(data);
        } catch (e) {}
      });

      // Send join
      client.publish({
        destination: '/app/presence.join',
        body: JSON.stringify({ userId, username, channelId }),
      });

      // Heartbeat
      clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (client?.connected) {
          client.publish({
            destination: '/app/presence.heartbeat',
            body: JSON.stringify({ userId }),
          });
        }
      }, 20000);
    },

    onStompError: (frame) => {
      isConnecting = false;
      console.error('STOMP error', frame);
      if (frame.headers?.message?.includes('JWT') ||
          frame.headers?.message?.includes('Unauthorized') ||
          frame.headers?.message?.includes('UserId mismatch')) {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        useStore.getState().logout();
        window.location.reload();
      }
    },

    onDisconnect: () => {
      isConnecting = false;
      console.log('WebSocket disconnected');
    },
  });

  client.activate();
  return client;
}

// ── switchChannel now just tells ChatPage which channel is active ──────────
// No need to resubscribe — already subscribed to all channels
export function switchChannel(channelId) {
  if (!client?.connected) {
    console.warn('⚠️ Cannot switch channel — not connected');
    return;
  }
  console.log(`🔀 Switched active channel to #${channelId}`);
  // Nothing to do here — already subscribed to all channels
}

export function sendMessage({ channelId, senderId, senderUsername, content }) {
  if (!client?.connected) {
    console.warn('⚠️ Cannot send — WebSocket not connected');
    return;
  }
  client.publish({
    destination: `/app/chat.send/${channelId}`,
    body: JSON.stringify({ channelId, senderId, senderUsername, content }),
  });
}

export function disconnectSocket({ userId, username, channelId }) {
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  isConnecting   = false;

  if (!client?.connected) {
    client = null;
    return;
  }

  try {
    client.publish({
      destination: '/app/presence.leave',
      body: JSON.stringify({ userId, username, channelId }),
    });
  } catch (e) {}

  setTimeout(() => {
    try { client?.deactivate(); } catch (e) {}
    client = null;
  }, 300);
}