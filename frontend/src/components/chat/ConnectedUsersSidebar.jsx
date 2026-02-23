import { useMemo, useState } from "react";
import { Avatar } from "../common/Avatar";
import { Badge } from "../common/Badge";

function getAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getAgeLabel(dateOfBirth) {
  const age = getAge(dateOfBirth);
  if (age === null) return "Age: Not specified";
  return `Age: ${age}`;
}

export function ConnectedUsersSidebar({
  users,
  rooms,
  groups,
  activeChatId,
  onSelectRoom,
  onStartChat,
  onDeleteHistory,
  onOpenGroup,
  onJoinGroup,
  hiddenHistoryIds = [],
  unreadByRoom = {},
  loading,
  groupsLoading,
}) {
  const [activeTab, setActiveTab] = useState("users");

  const onlineUsers = useMemo(
    () => users.filter((user) => user.isOnline),
    [users]
  );

  const directRooms = useMemo(
    () =>
      rooms.filter(
        (room) => room.type === "direct" && !hiddenHistoryIds.includes(room.id)
      ),
    [rooms, hiddenHistoryIds]
  );

  const visibleGroups = useMemo(
    () =>
      groups && groups.length > 0
        ? groups.map((group) => ({ ...group, isMember: Boolean(group.isMember) }))
        : rooms
            .filter((room) => room.type === "group")
            .map((room) => ({ ...room, isMember: true })),
    [groups, rooms]
  );

  const activeGroup = useMemo(
    () => visibleGroups.find((room) => room.id === activeChatId) || null,
    [visibleGroups, activeChatId]
  );

  const handleUserClick = (user) => {
    onStartChat(user);
  };

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-top">
        <div className="chat-tab-row">
          <button
            className={`chat-tab-btn ${activeTab === "users" ? "active" : ""}`.trim()}
            onClick={() => setActiveTab("users")}
            type="button"
          >
            Users
          </button>
          <button
            className={`chat-tab-btn ${activeTab === "groups" ? "active" : ""}`.trim()}
            onClick={() => setActiveTab("groups")}
            type="button"
          >
            Groups
          </button>
        </div>
      </div>

      {loading ? <p className="sidebar-note">Loading users...</p> : null}

      {activeTab === "users" ? (
        <>
          <div className="chat-sidebar-title">Connected Users</div>
          <div className="chat-list">
            {onlineUsers.map((user) => {
              const directRoom = directRooms.find((room) => room.directUserId === user.id);
              const isActive = activeChatId && directRoom?.id === activeChatId;
              const unreadCount = directRoom?.id ? unreadByRoom[directRoom.id] || 0 : 0;

              return (
                <button
                  key={user.id}
                  className={`chat-list-item ${isActive ? "active" : ""}`.trim()}
                  onClick={() => handleUserClick(user)}
                  type="button"
                >
                  <div className="avatar-unread-wrap">
                    <Avatar text={user.avatar} />
                    {unreadCount > 0 ? (
                      <span className="avatar-unread-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="chat-list-body">
                    <div className="chat-list-top">
                      <span>{user.name}</span>
                      <Badge tone={user.isOnline ? "success" : "neutral"}>
                        {user.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    <small>{getAgeLabel(user.dateOfBirth)}</small>
                  </div>
                </button>
              );
            })}
          </div>

          {!loading && onlineUsers.length === 0 ? (
            <p className="sidebar-note">No users online right now.</p>
          ) : null}

          <div className="chat-sidebar-top chat-sidebar-top-gap">
            <div className="chat-sidebar-title">Chat History</div>
          </div>
          <div className="chat-list">
            {directRooms.map((room) => (
              <div
                key={room.id}
                className={`chat-list-item ${activeChatId === room.id ? "active" : ""}`.trim()}
                onClick={() => onSelectRoom(room.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectRoom(room.id);
                  }
                }}
              >
                <Avatar text={room.avatar} />
                <div className="chat-list-body">
                  <div className="chat-list-top">
                    <span className="history-title">{room.title}</span>
                    <Badge tone={room.online ? "success" : "neutral"}>
                      {room.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="history-row">
                    <small>Direct chat history</small>
                    <div className="history-actions">
                      {unreadByRoom[room.id] ? (
                        <span className="history-unread-badge">{unreadByRoom[room.id]}</span>
                      ) : null}
                      <button
                        className="history-delete-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteHistory(room.id);
                        }}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {directRooms.length === 0 ? <p className="sidebar-note">No direct chat history yet.</p> : null}
        </>
      ) : (
        <>
          <div className="chat-sidebar-title">Active Groups</div>
          {groupsLoading ? <p className="sidebar-note">Loading groups...</p> : null}

          {activeGroup ? (
            <div className="active-group-card">
              <strong>{activeGroup.title}</strong>
              <small>{activeGroup.membersCount || 0} members</small>
            </div>
          ) : (
            <p className="sidebar-note">Pick a group to see active members count.</p>
          )}

          <div className="chat-list">
            {visibleGroups.map((room) => (
              <button
                key={room.id}
                className={`chat-list-item ${activeChatId === room.id ? "active" : ""}`.trim()}
                onClick={() => (room.isMember ? onOpenGroup(room.id) : onJoinGroup(room.id))}
                type="button"
              >
                <Avatar text={room.avatar} />
                <div className="chat-list-body">
                  <div className="chat-list-top">
                    <span>{room.title}</span>
                    <Badge tone={room.isMember ? "success" : "neutral"}>
                      {room.isMember ? "Joined" : "Public"}
                    </Badge>
                  </div>
                  <small>
                    {room.membersCount || 0} members -{" "}
                    {room.isMember ? "Open chat" : "Join group"}
                  </small>
                </div>
              </button>
            ))}
          </div>

          {!groupsLoading && visibleGroups.length === 0 ? (
            <p className="sidebar-note">No groups yet.</p>
          ) : null}
        </>
      )}
    </aside>
  );
}
