import { useMemo, useState } from "react";
import { parseAttachmentPayload } from "../../features/messages/utils/attachmentPayload";

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

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
          const attachment = parseAttachmentPayload(message.text);
          const messageType = String(message.messageType || "text").toLowerCase();
          const canEdit = own && !message.deleted && !attachment && messageType === "text";
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
                  <>
                    {attachment?.kind === "image" ? (
                      <div className="attachment-card">
                        <img
                          className="attachment-image"
                          src={attachment.dataUrl}
                          alt={attachment.fileName || "Shared image"}
                          loading="lazy"
                        />
                        <div className="attachment-caption">
                          <span>{attachment.fileName || "image"}</span>
                          <a href={attachment.dataUrl} download={attachment.fileName || "image"}>
                            Download
                          </a>
                        </div>
                      </div>
                    ) : attachment?.kind === "file" ? (
                      <div className="attachment-file">
                        <a
                          className="attachment-file-link"
                          href={attachment.dataUrl}
                          download={attachment.fileName || "file"}
                        >
                          {attachment.fileName || "Download file"}
                        </a>
                        <span className="attachment-file-meta">
                          {attachment.mimeType || "File"}
                          {formatFileSize(attachment.size) ? ` • ${formatFileSize(attachment.size)}` : ""}
                        </span>
                      </div>
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </>
                )}

                {messageTypeLabel(message.messageType) ? (
                  <div className="message-type-tag">{messageTypeLabel(message.messageType)}</div>
                ) : null}

                <div className="message-meta">
                  <small>{formatTime(message.timestamp)}</small>
                  {message.edited ? <small>(edited)</small> : null}
                  {own ? <small>{statusLabel(message.status)}</small> : null}
                </div>

                {canEdit && editingId !== message.id ? (
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
