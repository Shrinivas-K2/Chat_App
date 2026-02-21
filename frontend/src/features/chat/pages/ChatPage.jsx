import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../../../components/layout/MainLayout";
import { ChatSidebar } from "../../../components/chat/ChatSidebar";
import { GroupSidebar } from "../../../components/groups/GroupSidebar";
import { MessageList } from "../../../components/messages/MessageList";
import { MessageComposer } from "../../../components/messages/MessageComposer";
import { useChatStore } from "../../../store/chatStore";
import { useAuthStore } from "../../../store/authStore";
import { useSocket } from "../../../hooks/useSocket";
import {
  createGroupRoomApi,
  deleteGroupRoomApi,
  getRoomsApi,
} from "../api/chatApi";
import {
  deleteMessageApi,
  editMessageApi,
  getMessagesByRoomApi,
  markMessageSeenApi,
  sendMessageApi,
} from "../../messages/api/messageApi";
import { getApiErrorMessage } from "../../../utils/apiError";

export function ChatPage() {
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const messagesByChat = useChatStore((state) => state.messagesByChat);
  const typingByChat = useChatStore((state) => state.typingByChat);

  const setChats = useChatStore((state) => state.setChats);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const setMessagesForChat = useChatStore((state) => state.setMessagesForChat);
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const removeChat = useChatStore((state) => state.removeChat);

  const socket = useSocket();

  useEffect(() => {
    let active = true;

    const loadRooms = async () => {
      setIsLoadingRooms(true);
      setError("");
      try {
        const rooms = await getRoomsApi();
        if (active) {
          setChats(rooms);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load chat rooms."));
        }
      } finally {
        if (active) {
          setIsLoadingRooms(false);
        }
      }
    };

    loadRooms();

    return () => {
      active = false;
    };
  }, [setChats]);

  useEffect(() => {
    if (!activeChatId) return;
    socket.emit("room:join", { roomId: activeChatId });

    let active = true;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setError("");
      try {
        const messages = await getMessagesByRoomApi(activeChatId);
        if (!active) return;

        setMessagesForChat(activeChatId, messages);

        messages
          .filter((message) => message.senderId !== user?.id && message.status !== "seen")
          .forEach((message) => {
            markMessageSeenApi(message.id).catch(() => null);
          });
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load messages."));
        }
      } finally {
        if (active) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, [activeChatId, setMessagesForChat, socket, user?.id]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const messages = messagesByChat[activeChatId] || [];
  const typingUsers = typingByChat[activeChatId] || [];
  const groups = chats.filter((chat) => chat.type === "group");

  const handleSend = async (text) => {
    if (!activeChat) return;

    try {
      const message = await sendMessageApi({
        roomId: activeChat.id,
        text,
        messageType: "TEXT",
      });
      upsertMessage(message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send message."));
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeChat || !user) return;

    setTyping({ chatId: activeChat.id, userName: user.name, isTyping });
    socket.emit("typing:update", {
      chatId: activeChat.id,
      userName: user.name,
      isTyping,
    });
  };

  const handleEditMessage = async (messageId, text) => {
    try {
      const message = await editMessageApi(messageId, { text });
      upsertMessage(message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to edit message."));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const message = await deleteMessageApi(messageId);
      upsertMessage(message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete message."));
    }
  };

  const handleCreateGroup = async () => {
    const roomName = window.prompt("Group name");
    if (!roomName || !roomName.trim()) return;

    try {
      const room = await createGroupRoomApi({ roomName: roomName.trim(), memberIds: [] });
      upsertChat(room);
      setActiveChat(room.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create group."));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroupRoomApi(groupId);
      removeChat(groupId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete group."));
    }
  };

  if (isLoadingRooms) {
    return (
      <MainLayout>
        <div className="empty-state">Loading rooms...</div>
      </MainLayout>
    );
  }

  if (!activeChat) {
    return (
      <MainLayout>
        <div className="empty-state">
          <p>No chats available. Create a group to start.</p>
          <button className="btn btn-primary" onClick={handleCreateGroup}>
            + Create Group
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="chat-grid">
        <ChatSidebar chats={chats} activeChatId={activeChatId} onSelectChat={setActiveChat} />

        <section className="chat-panel">
          <header className="chat-panel-head">
            <h2>{activeChat.title}</h2>
            <small>{activeChat.type === "group" ? "Group" : "Direct"}</small>
          </header>

          {error ? <p className="error-text panel-error">{error}</p> : null}
          {isLoadingMessages ? <p className="panel-loading">Loading messages...</p> : null}

          <MessageList
            currentUserId={user?.id}
            messages={messages}
            typingUsers={typingUsers.filter((name) => name !== user?.name)}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />

          <MessageComposer onSend={handleSend} onTyping={handleTyping} />
        </section>

        <GroupSidebar groups={groups} onCreateGroup={handleCreateGroup} onDeleteGroup={handleDeleteGroup} />
      </div>
    </MainLayout>
  );
}
