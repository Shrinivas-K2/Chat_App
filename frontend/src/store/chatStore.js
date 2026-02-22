import { create } from "zustand";

function sortByTimeDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
  );
}

function upsertById(list, item) {
  const index = list.findIndex((value) => value.id === item.id);
  if (index === -1) {
    return [...list, item];
  }

  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

export const useChatStore = create((set, get) => ({
  chats: [],
  messagesByChat: {},
  activeChatId: null,
  typingByChat: {},
  notifications: [],

  setChats: (chats) => {
    set((state) => {
      const nextChats = sortByTimeDesc(chats);
      const activeStillExists = nextChats.some((chat) => chat.id === state.activeChatId);

      return {
        chats: nextChats,
        activeChatId: activeStillExists ? state.activeChatId : nextChats[0]?.id || null,
      };
    });
  },

  upsertChat: (chat) => {
    set((state) => ({
      chats: sortByTimeDesc(upsertById(state.chats, chat)),
    }));
  },

  removeChat: (chatId) => {
    set((state) => {
      const nextChats = state.chats.filter((chat) => chat.id !== chatId);
      const nextMessagesByChat = { ...state.messagesByChat };
      delete nextMessagesByChat[chatId];

      return {
        chats: nextChats,
        messagesByChat: nextMessagesByChat,
        activeChatId: state.activeChatId === chatId ? nextChats[0]?.id || null : state.activeChatId,
      };
    });
  },

  setActiveChat: (chatId) => set({ activeChatId: chatId }),

  setMessagesForChat: (chatId, messages) => {
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: messages,
      },
    }));
  },

  upsertMessage: (message) => {
    set((state) => {
      const existing = state.messagesByChat[message.chatId] || [];
      const nextMessagesByChat = {
        ...state.messagesByChat,
        [message.chatId]: upsertById(existing, message),
      };

      const nextChats = state.chats
        .map((chat) =>
          chat.id === message.chatId
            ? {
                ...chat,
                lastMessageAt: message.timestamp,
              }
            : chat
        )
        .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

      return {
        messagesByChat: nextMessagesByChat,
        chats: nextChats,
      };
    });
  },

  updateMessageStatus: ({ chatId, messageId, status }) => {
    set((state) => {
      const next = (state.messagesByChat[chatId] || []).map((message) =>
        message.id === messageId ? { ...message, status } : message
      );

      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: next,
        },
      };
    });
  },

  setTyping: ({ chatId, userName, isTyping }) => {
    set((state) => {
      const names = state.typingByChat[chatId] || [];
      const nextNames = isTyping
        ? Array.from(new Set([...names, userName]))
        : names.filter((name) => name !== userName);

      return {
        typingByChat: {
          ...state.typingByChat,
          [chatId]: nextNames,
        },
      };
    });
  },

  pushNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 30),
    }));
  },

  clearNotificationsByRoom: (roomId) => {
    if (!roomId) return;
    set((state) => ({
      notifications: state.notifications.filter((item) => item.roomId !== roomId),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  reset: () =>
    set({
      chats: [],
      messagesByChat: {},
      activeChatId: null,
      typingByChat: {},
      notifications: [],
    }),
}));
