import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, unreadCounts: {}, notifications: [] });
  },

  // Chat
  activeChannel: 'general',
  setActiveChannel: (channel) => set((state) => ({
    activeChannel: channel,
    messages: [],
    // Clear unread when switching to that channel
    unreadCounts: { ...state.unreadCounts, [channel]: 0 },
  })),

  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
  })),
  setMessages: (messages) => set({ messages }),

  // ── Unread counts per channel ──────────────────────────────────────
  unreadCounts: {},
  incrementUnread: (channelId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [channelId]: (state.unreadCounts[channelId] || 0) + 1,
    },
  })),
  clearUnread: (channelId) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
  })),

  // ── Toast notifications ────────────────────────────────────────────
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications.slice(-4), // max 5 at once
      { ...notification, id: Date.now() + Math.random() },
    ],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  // Presence
  onlineUsers: {},
  setUserOnline: (userId, username) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [userId]: username },
  })),
  setUserOffline: (userId) => set((state) => {
    const updated = { ...state.onlineUsers };
    delete updated[userId];
    return { onlineUsers: updated };
  }),
}));

export default useStore;