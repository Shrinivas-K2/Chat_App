import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../../../components/layout/MainLayout";
import { ConnectedUsersSidebar } from "../../../components/chat/ConnectedUsersSidebar";
import { MessageList } from "../../../components/messages/MessageList";
import { MessageComposer } from "../../../components/messages/MessageComposer";
import { useChatStore } from "../../../store/chatStore";
import { useAuthStore } from "../../../store/authStore";
import { useSocket } from "../../../hooks/useSocket";
import {
  createGroupRoomApi,
  createPrivateRoomApi,
  getPublicGroupsApi,
  getRoomsApi,
  hideRoomHistoryApi,
  requestJoinGroupApi,
} from "../api/chatApi";
import {
  clearChatRoomApi,
  deleteMessageApi,
  editMessageApi,
  getMessagesByRoomApi,
  markMessageSeenApi,
  sendMessageApi,
} from "../../messages/api/messageApi";
import { getConnectedUsersApi } from "../../user/api/userApi";
import { getApiErrorMessage } from "../../../utils/apiError";

export function ChatPage() {
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [hiddenHistoryIds, setHiddenHistoryIds] = useState([]);

  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const messagesByChat = useChatStore((state) => state.messagesByChat);
  const typingByChat = useChatStore((state) => state.typingByChat);
  const notifications = useChatStore((state) => state.notifications);

  const setChats = useChatStore((state) => state.setChats);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const setMessagesForChat = useChatStore((state) => state.setMessagesForChat);
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const pushNotification = useChatStore((state) => state.pushNotification);
  const clearNotificationsByRoom = useChatStore((state) => state.clearNotificationsByRoom);

  const socket = useSocket();

  useEffect(() => {
    if (!user?.id) return;
    const raw = localStorage.getItem(`hidden_history_${user.id}`);
    if (!raw) {
      setHiddenHistoryIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setHiddenHistoryIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHiddenHistoryIds([]);
    }
  }, [user?.id]);

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
    let active = true;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await getConnectedUsersApi();
        if (active) {
          setConnectedUsers(users);
        }
      } catch {
        if (active) {
          setConnectedUsers([]);
        }
      } finally {
        if (active) {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPublicGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const groups = await getPublicGroupsApi();
        if (active) {
          setPublicGroups(groups);
        }
      } catch {
        if (active) {
          setPublicGroups([]);
        }
      } finally {
        if (active) {
          setIsLoadingGroups(false);
        }
      }
    };

    loadPublicGroups();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    socket.emit("room:join", { roomId: activeChatId });
    clearNotificationsByRoom(activeChatId);

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
  }, [activeChatId, clearNotificationsByRoom, setMessagesForChat, socket, user?.id]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const messages = messagesByChat[activeChatId] || [];
  const typingUsers = typingByChat[activeChatId] || [];
  const unreadByRoom = useMemo(() => {
    return notifications.reduce((acc, item) => {
      if (!(item.type === "message" || /^New message from/i.test(String(item.title || "")))) {
        return acc;
      }
      if (!item.roomId) return acc;
      acc[item.roomId] = (acc[item.roomId] || 0) + 1;
      return acc;
    }, {});
  }, [notifications]);

  const handleSend = async (input) => {
    if (!activeChat) return;

    const payload =
      typeof input === "string"
        ? { text: input, messageType: "TEXT" }
        : {
            text: input?.text || "",
            messageType: input?.messageType || "TEXT",
          };

    if (!payload.text || !payload.text.trim()) return;

    try {
      const message = await sendMessageApi({
        roomId: activeChat.id,
        text: payload.text,
        messageType: payload.messageType,
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

  const handleClearChat = async () => {
    if (!activeChat) return;

    const ok = window.confirm("Clear all messages in this chat?");
    if (!ok) return;

    try {
      await clearChatRoomApi(activeChat.id);
      setMessagesForChat(activeChat.id, []);
      setInfo("Chat cleared.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to clear chat."));
    }
  };

  const handleCreateGroup = async () => {
    const roomName = window.prompt("Group name");
    if (!roomName || !roomName.trim()) return;

    try {
      const room = await createGroupRoomApi({ roomName: roomName.trim(), memberIds: [] });
      upsertChat(room);
      setActiveChat(room.id);
      const groups = await getPublicGroupsApi();
      setPublicGroups(groups);
      setInfo("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create group."));
    }
  };

  const handleStartChatWithUser = async (targetUser) => {
    const targetUserId = targetUser?.id || targetUser;
    if (!targetUserId) return;

    setError("");
    setInfo("");

    const existingDirectRoom = chats.find(
      (room) => room.type === "direct" && room.directUserId === targetUserId
    );

    if (existingDirectRoom) {
      setHiddenHistoryIds((prev) => {
        const next = prev.filter((id) => id !== existingDirectRoom.id);
        if (user?.id) {
          localStorage.setItem(`hidden_history_${user.id}`, JSON.stringify(next));
        }
        return next;
      });
      setActiveChat(existingDirectRoom.id);
      return;
    }

    try {
      const data = await createPrivateRoomApi({ targetUserId });

      if (data.room) {
        upsertChat(data.room);
        setActiveChat(data.room.id);
        return;
      }

      if (data.requestPending) {
        setInfo("Chat request sent. Wait for acceptance to start messaging.");
        pushNotification({
          title: "Request sent",
          body: "Chat request sent. Waiting for user acceptance.",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to start chat."));
    }
  };

  const handleDeleteHistory = async (roomId) => {
    try {
      await hideRoomHistoryApi(roomId);
    } catch {
      // keep local hide even if API call fails
    }

    const nextHidden = hiddenHistoryIds.includes(roomId)
      ? hiddenHistoryIds
      : [...hiddenHistoryIds, roomId];
    setHiddenHistoryIds(nextHidden);
    if (user?.id) {
      localStorage.setItem(`hidden_history_${user.id}`, JSON.stringify(nextHidden));
    }

    if (activeChatId === roomId) {
      const nextRoom = chats.find(
        (room) => room.id !== roomId && room.type === "direct" && !nextHidden.includes(room.id)
      );
      setActiveChat(nextRoom?.id || null);
    }
  };

  const handleOpenGroup = (groupId) => {
    setActiveChat(groupId);
    setError("");
    setInfo("");
  };

  const handleJoinGroup = async (groupId) => {
    setError("");
    setInfo("");

    try {
      const data = await requestJoinGroupApi(groupId);
      if (data.room) {
        upsertChat(data.room);
        setActiveChat(data.room.id);
      }

      const groups = await getPublicGroupsApi();
      setPublicGroups(groups);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to join group."));
    }
  };

  const headerAction = (
    <button className="btn btn-primary btn-top-create-group" onClick={handleCreateGroup}>
      + Create Group
    </button>
  );

  return (
    <MainLayout headerAction={headerAction}>
      <div className="chat-grid two-col">
        <ConnectedUsersSidebar
          users={connectedUsers}
          rooms={chats}
          groups={publicGroups}
          activeChatId={activeChatId}
          onSelectRoom={setActiveChat}
          onStartChat={handleStartChatWithUser}
          onDeleteHistory={handleDeleteHistory}
          onOpenGroup={handleOpenGroup}
          onJoinGroup={handleJoinGroup}
          hiddenHistoryIds={hiddenHistoryIds}
          unreadByRoom={unreadByRoom}
          loading={isLoadingUsers || isLoadingRooms}
          groupsLoading={isLoadingGroups}
        />

        <section className="chat-panel">
          {activeChat ? (
            <>
              <header className="chat-panel-head">
                <h2>{activeChat.title}</h2>
                <div className="chat-head-actions">
                  <small>
                    {activeChat.type === "group"
                      ? `${activeChat.membersCount || 0} members`
                      : "Direct"}
                  </small>
                  <button className="mini-btn" onClick={handleClearChat} type="button">
                    Clear Chat
                  </button>
                </div>
              </header>

              {error ? <p className="error-text panel-error">{error}</p> : null}
              {info ? <p className="panel-loading">{info}</p> : null}
              {isLoadingMessages ? <p className="panel-loading">Loading messages...</p> : null}

              <MessageList
                currentUserId={user?.id}
                messages={messages}
                isGroup={activeChat.type === "group"}
                typingUsers={typingUsers.filter((name) => name !== user?.name)}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
              />

              <MessageComposer onSend={handleSend} onTyping={handleTyping} />
            </>
          ) : (
            <div className="chat-empty-panel">
              <div>
                <h2>Go and search and chat with your loved persons.</h2>
                <p>Pick a connected user from the left to begin.</p>
                {info ? <p className="panel-loading">{info}</p> : null}
                {error ? <p className="error-text panel-error">{error}</p> : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
