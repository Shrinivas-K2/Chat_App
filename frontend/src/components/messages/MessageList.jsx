import { useMemo, useState } from "react";

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  if (status === "sent") return "S";
  if (status === "delivered") return "D";
  if (status === "seen") return "Seen";
  return "";
}

function messageTypeLabel(type) {
  const upper = String(type || "text").toUpperCase();
  if (upper === "TEXT") return "";
  return upper;
}

export function MessageList({
  currentUserId,
  messages,
  typingUsers,
  onEditMessage,
  onDeleteMessage,
  isGroup = false,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const visibleTypingText = useMemo(() => {
    if (!typingUsers || typingUsers.length === 0) return "";
    return `${typingUsers.join(", ")} typing...`;
  }, [typingUsers]);

  return (
    <section className="message-list-wrap">
      <div className="message-list">
        {messages.map((message) => {
          const own = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`message-row ${own ? "own" : ""}`.trim()}>
              <div className="message-bubble">
                {isGroup ? (
                  <small className="message-sender">{own ? "You" : message.senderName || "User"}</small>
                ) : null}

                {editingId === message.id ? (
                  <div className="edit-inline">
                    <input
                      className="edit-input"
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                    />
                    <button
                      className="mini-btn"
                      onClick={() => {
                        onEditMessage(message.id, editingValue);
                        setEditingId(null);
                      }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p>{message.text}</p>
                )}

                {messageTypeLabel(message.messageType) ? (
                  <div className="message-type-tag">{messageTypeLabel(message.messageType)}</div>
                ) : null}

                <div className="message-meta">
                  <small>{formatTime(message.timestamp)}</small>
                  {message.edited ? <small>(edited)</small> : null}
                  {own ? <small>{statusLabel(message.status)}</small> : null}
                </div>

                {own && !message.deleted && editingId !== message.id ? (
                  <div className="message-actions">
                    <button
                      className="link-btn"
                      onClick={() => {
                        setEditingId(message.id);
                        setEditingValue(message.text);
                      }}
                    >
                      Edit
                    </button>
                    <button className="link-btn danger" onClick={() => onDeleteMessage(message.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {visibleTypingText ? <div className="typing-indicator">{visibleTypingText}</div> : null}
    </section>
  );
}
