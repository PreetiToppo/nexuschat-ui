import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import useStore from '../store/useStore';

let client            = null;
let heartbeatTimer    = null;
let isConnecting      = false;
let currentSubscription = null;   // ← track active channel subscription
let messageHandler    = null;     // ← store handler so switchChannel can reuse it
let presenceHandler   = null;     // ← store handler so switchChannel can reuse it

export function connectSocket({ userId, username, channelId, onMessage, onPresence }) {
  if (isConnecting) return client;

  if (client) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    isConnecting   = false;
    try { client.deactivate(); } catch (e) {}
    client = null;
  }

  // Store handlers so switchChannel can reuse them
  messageHandler  = onMessage;
  presenceHandler = onPresence;

  const accessToken = useStore.getState().accessToken;
  isConnecting      = true;

  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
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

      // Subscribe to initial channel
      subscribeToChannel(channelId);

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

// ── Switch channel without reconnecting ────────────────────────────────────
function subscribeToChannel(channelId) {
  // Unsubscribe from previous channel
  if (currentSubscription) {
    try { currentSubscription.unsubscribe(); } catch (e) {}
    currentSubscription = null;
  }

  // Subscribe to new channel
  currentSubscription = client.subscribe(
    `/topic/channel/${channelId}`,
    (msg) => {
      try {
        const data = JSON.parse(msg.body);
        if (data.eventType === 'MESSAGE') messageHandler?.(data);
      } catch (e) {}
    }
  );

  console.log(`📡 Subscribed to channel: ${channelId}`);
}

export function switchChannel(channelId) {
  if (!client?.connected) {
    console.warn('⚠️ Cannot switch channel — not connected');
    return;
  }
  subscribeToChannel(channelId);
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