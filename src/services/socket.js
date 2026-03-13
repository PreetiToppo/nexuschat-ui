import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import useStore from '../store/useStore';                           // ← added

let client = null;
let heartbeatTimer = null;

export function connectSocket({ userId, username, channelId, onMessage, onPresence }) {
  const accessToken = useStore.getState().accessToken;             // ← read from memory

  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    connectHeaders: {
      userId,
      username,
      Authorization: `Bearer ${accessToken}`,                      // ← use memory token
    },

    // ... rest stays the same
  });

  client.activate();
  return client;
}