import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: null,                                        // ← no longer from localStorage

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', refreshToken);     // ← persist refresh only
    // accessToken stays in memory only
    set({ user, accessToken });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');                // ← changed from accessToken
    set({ user: null, accessToken: null });
  },

  // Chat
  activeChannel: 'general',
  setActiveChannel: (channel) => set({ activeChannel: channel, messages: [] }),

  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
  })),
  setMessages: (messages) => set({ messages }),

  // Presence
  onlineUsers: {},
  setUserOnline:  (userId, username) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [userId]: username },
  })),
  setUserOffline: (userId) => set((state) => {
    const updated = { ...state.onlineUsers };
    delete updated[userId];
    return { onlineUsers: updated };
  }),
}));

export default useStore;