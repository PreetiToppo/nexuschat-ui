# ⚡ NexusChat — Client

The frontend for NexusChat. Built with **React**, **Vite**, **Tailwind CSS**, and **STOMP WebSockets**. Features real-time messaging, presence indicators, and JWT-based authentication.

> **Backend repo:** [nexuschat-server](https://github.com/your-username/nexuschat-server)

---

## ✨ Features

- Login / Register with JWT auth (persisted in `localStorage`)
- Real-time messaging via WebSocket (STOMP over SockJS)
- Typing indicators
- Online presence — live green/grey dot per user
- Multiple channels: `general`, `engineering`, `design`, `random`
- Message history loaded on channel join
- Auto-scroll to latest message
- Responsive dark UI

---

## 🛠️ Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| WebSocket | @stomp/stompjs + SockJS |
| HTTP | Axios |
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

The backend URL is set in two places. Update both if your server runs elsewhere:

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

---

## 📁 Project Structure

```
src/
├── components/
│   ├── MessageInput.jsx     # Text input + send button
│   ├── MessageList.jsx      # Scrollable message bubbles
│   ├── PresenceDot.jsx      # Online/offline indicator dot
│   └── Sidebar.jsx          # Channel list + online users
├── pages/
│   ├── LoginPage.jsx        # Login / Register tabs
│   └── ChatPage.jsx         # Main chat layout + socket lifecycle
├── services/
│   ├── api.js               # Axios instance + auth/chat API calls
│   └── socket.js            # STOMP connect, send, disconnect helpers
├── store/
│   └── useStore.js          # Zustand global state
├── App.jsx                  # Auth gate — LoginPage vs ChatPage
└── main.jsx                 # React root
```

---

## 🗄️ State Management

Global state lives in Zustand (`src/store/useStore.js`):

| Slice | Fields | Description |
|-------|--------|-------------|
| Auth | `user`, `accessToken` | Persisted to `localStorage` |
| Chat | `activeChannel`, `messages` | Cleared on channel switch |
| Presence | `onlineUsers` | `{ userId: username }` map |

---

## 🔌 WebSocket Lifecycle

Managed in `ChatPage.jsx` via `useEffect` on `activeChannel`:

```
Mount / channel change
  → Load message history (REST GET)
  → connectSocket()
      ├── Subscribe /topic/channel/{channelId}  → addMessage()
      ├── Subscribe /topic/presence             → setUserOnline/Offline()
      ├── Publish presence.join
      └── Start heartbeat interval (every 20s)

Unmount / channel change
  → Publish presence.leave
  → Clear heartbeat
  → client.deactivate()
```

---

## 🎨 UI Overview

```
┌──────────────────────────────────────────────┐
│  Sidebar (w-60)        │  Chat Area           │
│  ─────────────         │  ──────────────────  │
│  ⚡ NexusChat          │  # general           │
│  ● alice               │                      │
│                        │  [MessageList]        │
│  CHANNELS              │                      │
│  # general  ←active    │                      │
│  # engineering         │                      │
│  # design              │                      │
│  # random              │  [MessageInput]       │
│                        │                      │
│  ONLINE — 2            │                      │
│  ● alice               │                      │
│  ● bob                 │                      │
│                        │                      │
│  Sign out              │                      │
└──────────────────────────────────────────────┘
```

---

## 🔐 Auth Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. `accessToken`, `userId`, and `username` are stored in `localStorage`
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request
4. On logout, `localStorage` is cleared and state is reset

> **Note:** Token refresh is not yet implemented. The access token expires after 15 minutes, at which point the user will need to log in again.

---

## 📄 License

MIT
