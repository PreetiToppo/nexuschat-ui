import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';

let client = null;
let heartbeatTimer = null;

export function connectSocket({ userId, username, channelId, onMessage, onPresence }) {
  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

    connectHeaders: {
      userId,
      username,
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,  // ← added
    },

    onConnect: () => {
      console.log('✅ WebSocket connected');

      client.subscribe(`/topic/channel/${channelId}`, (msg) => {
        const data = JSON.parse(msg.body);
        if (data.eventType === 'MESSAGE') onMessage(data);
      });

      client.subscribe('/topic/presence', (msg) => {
        const data = JSON.parse(msg.body);
        onPresence(data);
      });

      client.publish({
        destination: '/app/presence.join',
        body: JSON.stringify({ userId, username, channelId }),
      });

      heartbeatTimer = setInterval(() => {
        client.publish({
          destination: '/app/presence.heartbeat',
          body: JSON.stringify({ userId }),
        });
      }, 20000);
    },

    // ← added: handle auth rejection from server
    onStompError: (frame) => {
      console.error('STOMP error', frame);
      if (frame.headers?.message?.includes('JWT') ||
          frame.headers?.message?.includes('Unauthorized') ||
          frame.headers?.message?.includes('UserId mismatch')) {
        console.error('🔒 WebSocket auth failed — logging out');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.reload(); // boot user back to login page
      }
    },

    onDisconnect: () => console.log('WebSocket disconnected'),
  });

  client.activate();
  return client;
}

export function sendMessage({ channelId, senderId, senderUsername, content }) {
  if (!client?.connected) return;
  client.publish({
    destination: `/app/chat.send/${channelId}`,
    body: JSON.stringify({ channelId, senderId, senderUsername, content }),
  });
}

export function disconnectSocket({ userId, username, channelId }) {
  if (!client?.connected) return;
  client.publish({
    destination: '/app/presence.leave',
    body: JSON.stringify({ userId, username, channelId }),
  });
  clearInterval(heartbeatTimer);
  setTimeout(() => client.deactivate(), 300);
}