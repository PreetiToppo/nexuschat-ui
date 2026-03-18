# ⚡ NexusChat — Client

The frontend for NexusChat. Built with **React**, **Vite**, **Tailwind CSS**, and **STOMP WebSockets**. Features real-time messaging, presence indicators, JWT authentication, and **AI-powered reply suggestions** streamed live from the backend.

> **Backend repo:** [nexuschat-server](https://github.com/your-username/nexuschat-server)

---

## ✨ Features

- Login / Register with client-side validation + JWT auth
- Real-time messaging via WebSocket (STOMP over SockJS)
- Typing indicators (ephemeral, not stored)
- Live presence — green/grey dot per user, updated in real time
- Multiple channels: `general`, `engineering`, `design`, `random`
- Unread message badges + toast notifications for background channels
- Message history loaded on channel join with auto-scroll
- **AI reply suggestions** — 3 context-aware suggestions streamed live with a typing effect, powered by Groq (`llama-3.1-8b-instant`)

---

## 🛠️ Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| WebSocket | @stomp/stompjs + SockJS |
| HTTP | Axios |
| AI Streaming | EventSource (SSE) |
| Date formatting | date-fns |

---

## ⚙️ Prerequisites

- Node.js 18+
- npm or yarn
- [NexusChat Server](https://github.com/your-username/nexuschat-server) running on `localhost:8080`

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/your-username/nexuschat-client.git
cd nexuschat-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Build for production

```bash
npm run build
```

---

## 🔧 Configuration

The backend URL is hardcoded in two files. Update both if your server runs on a different host or port:

**`src/services/api.js`** — REST base URL:
```js
const api = axios.create({
  baseURL: 'http://localhost:8080',  // ← change this
});
```

**`src/services/socket.js`** — WebSocket URL:
```js
webSocketFactory: () => new SockJS('http://localhost:8080/ws'),  // ← change this
```

The AI suggestion endpoint is called directly in `SuggestionBar.jsx`:
```js
const url = `http://localhost:8080/api/ai/suggest/${channelId}`;  // ← change this
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── MessageInput.jsx       # Text input, send button, AI toggle (✦)
│   ├── MessageList.jsx        # Scrollable message bubbles
│   ├── SuggestionBar.jsx      # AI reply suggestions with live SSE stream
│   ├── NotificationToast.jsx  # Background channel toast notifications
│   ├── PresenceDot.jsx        # Online/offline indicator dot
│   └── Sidebar.jsx            # Channel list, unread badges, online users
├── pages/
│   ├── LoginPage.jsx          # Login / Register tabs + password strength
│   └── ChatPage.jsx           # Main chat layout + socket lifecycle
├── services/
│   ├── api.js                 # Axios instance + auth/chat/presence API calls
│   └── socket.js              # STOMP connect, send, switch channel, disconnect
├── store/
│   └── useStore.js            # Zustand global state
├── App.jsx                    # Auth gate — LoginPage vs ChatPage
└── main.jsx                   # React root (StrictMode removed — see note)
```

---

## 🗄️ State (Zustand)

| Slice | Fields | Description |
|-------|--------|-------------|
| Auth | `user`, `accessToken` | `user` persisted to `localStorage` |
| Chat | `activeChannel`, `messages` | Messages cleared on channel switch |
| Unread | `unreadCounts` | Per-channel unread badge counts |
| Notifications | `notifications` | Toast queue (max 5) |
| Presence | `onlineUsers` | `{ userId: username }` map |

---

## 🤖 AI Reply Suggestions

The `SuggestionBar` component sits above the message input and is toggled with the **✦** sparkle button.

**How it works:**

1. When the suggestion bar opens, it calls `GET /api/ai/suggest/{channelId}` as an SSE stream
2. Incoming `token` events are shown as a live typing preview (monospace, with blinking cursor)
3. When the `suggestions` event arrives, 3 pill buttons render with a fade-in animation
4. Clicking a pill sends the message immediately
5. A refresh button (↻) lets you regenerate suggestions at any time
6. If the channel hasn't changed since the last fetch, the backend returns a cached result instantly — no LLM call

**Fallback:** If the backend has no Groq API key or the request fails, static suggestions are shown so the UI never breaks.

---

## 🔌 WebSocket Lifecycle

Managed in `ChatPage.jsx`:

```
App mounts (user logged in)
  → connectSocket()
      ├── Subscribe to ALL 4 channels at once (general, engineering, design, random)
      ├── Subscribe to /topic/presence
      ├── Publish presence.join
      └── Start heartbeat interval (every 20s)

Message received
  ├── Active channel  → addMessage() → renders in MessageList
  └── Other channel   → incrementUnread() + addNotification() → toast appears

User switches channel
  → Load history via REST GET /api/channels/{channelId}/messages
  → Clear unread count for that channel
  (No resubscription needed — already subscribed to all channels)

App unmounts / logout
  → Publish presence.leave
  → Clear heartbeat
  → client.deactivate()
```

> **Note:** `StrictMode` is intentionally removed from `main.jsx`. React's double-mount in development fired `connectSocket()` twice, killing the first connection.

---

## 🔐 Auth Flow

1. User registers or logs in — `user` object and `refreshToken` saved to `localStorage`, `accessToken` kept in Zustand memory only
2. Axios interceptor automatically attaches `Authorization: Bearer <token>` to every request
3. On 401, the interceptor attempts a token refresh via `/api/auth/refresh`; if that fails, the user is logged out and the page reloads
4. On logout, `localStorage` is cleared and all state is reset

---

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (w-60)              │  Chat Area                │
│  ──────────────              │  ─────────────────────    │
│  ⚡ NexusChat                │  # general                │
│  ● alice (you)               │                           │
│                              │  [MessageList]            │
│  CHANNELS                    │   bubble  bubble          │
│  # general     ← active      │         bubble            │
│  # engineering  [3]          │                           │
│  # design                    │  [SuggestionBar]          │
│  # random       [1]          │   ✦ Sure!  Got it  Why?   │
│                              │                           │
│  ONLINE — 2                  │  [MessageInput]           │
│  ● alice                     │   ✦ _______________ ➤    │
│  ● bob                       │                           │
│                              │                           │
│  Sign out                    │                           │
└─────────────────────────────────────────────────────────┘
                                    ↗ Toast notifications
                                      (bottom-right)
```

---

## 📄 License

MIT
