import { createContext, useContext, useEffect, useMemo } from "react";
import { socketClient } from "../services/socket/socketClient";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

const SocketContext = createContext(socketClient);

export function SocketProvider({ children }) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const setTyping = useChatStore((state) => state.setTyping);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);
  const pushNotification = useChatStore((state) => state.pushNotification);
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const setMessagesForChat = useChatStore((state) => state.setMessagesForChat);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketClient.disconnect();
      return;
    }

    const socket = socketClient.connect(token);

    const onTyping = ({ chatId, userName, isTyping: typing }) => {
      setTyping({ chatId, userName, isTyping: typing });
    };

    const onStatus = ({ chatId, messageId, status }) => {
      updateMessageStatus({ chatId, messageId, status });
    };

    const onNotification = (notification) => {
      pushNotification(notification);
    };

    const onMessageNew = (message) => {
      upsertMessage(message);
    };

    const onMessageUpdated = (message) => {
      upsertMessage(message);
    };

    const onMessageDeleted = (payload) => {
      if (payload?.message) {
        upsertMessage(payload.message);
      }
    };

    const onRoomAvailable = ({ room }) => {
      if (room) {
        upsertChat(room);
        pushNotification({
          title: room.type === "direct" ? "Request accepted" : "Group joined",
          body:
            room.type === "direct"
              ? "Your request was accepted. You can chat now."
              : `You can now chat in ${room.title}.`,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const onChatCleared = ({ chatId, clearedBy }) => {
      if (!chatId) return;
      setMessagesForChat(chatId, []);
      if (clearedBy) {
        pushNotification({
          title: "Chat cleared",
          body: "Messages were cleared in this chat.",
          timestamp: new Date().toISOString(),
        });
      }
    };

    socket.on("typing:update", onTyping);
    socket.on("message:status", onStatus);
    socket.on("notification:new", onNotification);
    socket.on("message:new", onMessageNew);
    socket.on("message:updated", onMessageUpdated);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("room:available", onRoomAvailable);
    socket.on("chat:cleared", onChatCleared);

    return () => {
      socket.off("typing:update", onTyping);
      socket.off("message:status", onStatus);
      socket.off("notification:new", onNotification);
      socket.off("message:new", onMessageNew);
      socket.off("message:updated", onMessageUpdated);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("room:available", onRoomAvailable);
      socket.off("chat:cleared", onChatCleared);
    };
  }, [
    isAuthenticated,
    token,
    setTyping,
    updateMessageStatus,
    pushNotification,
    upsertMessage,
    upsertChat,
    setMessagesForChat,
  ]);

  const value = useMemo(() => socketClient, []);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  return useContext(SocketContext);
}
