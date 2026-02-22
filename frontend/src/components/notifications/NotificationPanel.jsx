import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChatStore } from "../../store/chatStore";
import { createPrivateRoomApi } from "../../features/chat/api/chatApi";

function getMessageSender(item) {
  if (item.senderName) return item.senderName;
  const title = String(item.title || "");
  const match = title.match(/^New message from (.+)$/i);
  return match?.[1] || "User";
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const notifications = useChatStore((state) => state.notifications);
  const clearNotifications = useChatStore((state) => state.clearNotifications);
  const clearNotificationsByRoom = useChatStore((state) => state.clearNotificationsByRoom);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const upsertChat = useChatStore((state) => state.upsertChat);

  const groupedMessageNotifications = useMemo(() => {
    const groups = new Map();

    notifications
      .filter((item) => item.type === "message" || /^New message from/i.test(String(item.title || "")))
      .forEach((item) => {
        const roomId = item.roomId || `unknown-${getMessageSender(item)}`;
        const existing = groups.get(roomId);
        if (existing) {
          existing.count += 1;
          existing.lastBody = item.body || existing.lastBody;
          return;
        }

        groups.set(roomId, {
          roomId: item.roomId || null,
          senderId: item.senderId || null,
          senderName: getMessageSender(item),
          count: 1,
          lastBody: item.body || "",
        });
      });

    return Array.from(groups.values());
  }, [notifications]);

  const nonMessageNotifications = useMemo(
    () =>
      notifications.filter(
        (item) => !(item.type === "message" || /^New message from/i.test(String(item.title || "")))
      ),
    [notifications]
  );

  const totalCount =
    groupedMessageNotifications.reduce((sum, item) => sum + item.count, 0) +
    nonMessageNotifications.length;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleOpenRoomNotification = async (item) => {
    let roomId = item?.roomId;
    try {
      if (item?.senderId) {
        const data = await createPrivateRoomApi({ targetUserId: item.senderId });
        if (data?.room) {
          upsertChat(data.room);
          roomId = data.room.id;
        }
      }
    } catch {
      // Fallback to roomId-only open flow.
    }

    if (!roomId) return;
    setActiveChat(roomId);
    clearNotificationsByRoom(roomId);
    setOpen(false);
    navigate("/chat");
  };

  return (
    <div className="notification-wrap" ref={panelRef}>
      <button
        className={`mini-btn ${open ? "is-open" : ""}`.trim()}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        Alerts ({totalCount})
      </button>
      {open ? (
        <div className="notification-card">
          <div className="notification-head">
            <strong>Notifications</strong>
            <button className="link-btn" onClick={clearNotifications} type="button">
              Clear
            </button>
          </div>

          {totalCount === 0 ? <p>No notifications</p> : null}

          {groupedMessageNotifications.map((item) => (
            <button
              key={`msg-${item.roomId || item.senderName}`}
              className="notification-item notification-item-btn"
              onClick={() => handleOpenRoomNotification(item)}
              type="button"
            >
              <strong>{item.senderName}</strong>
              <p>
                {item.count} new message{item.count > 1 ? "s" : ""}
              </p>
              {item.lastBody ? <small>{item.lastBody}</small> : null}
            </button>
          ))}

          {nonMessageNotifications.map((item, index) => (
            <div key={`${item.title || "n"}-${index}`} className="notification-item">
              <strong>{item.title || "Message"}</strong>
              <p>{item.body || "New update"}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
