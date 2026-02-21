import { Avatar } from "../common/Avatar";
import { Badge } from "../common/Badge";

export function ChatSidebar({ chats, activeChatId, onSelectChat }) {
  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-title">Conversations</div>
      <div className="chat-list">
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={`chat-list-item ${activeChatId === chat.id ? "active" : ""}`.trim()}
            onClick={() => onSelectChat(chat.id)}
          >
            <Avatar text={chat.avatar} />
            <div className="chat-list-body">
              <div className="chat-list-top">
                <span>{chat.title}</span>
                {chat.online ? <Badge tone="success">Online</Badge> : null}
              </div>
              <small>{chat.type === "group" ? "Group chat" : "Direct chat"}</small>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
