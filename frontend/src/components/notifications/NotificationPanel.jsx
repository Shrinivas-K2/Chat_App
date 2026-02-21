import { useState } from "react";
import { useChatStore } from "../../store/chatStore";

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const notifications = useChatStore((state) => state.notifications);
  const clearNotifications = useChatStore((state) => state.clearNotifications);

  return (
    <div className="notification-wrap">
      <button className="mini-btn" onClick={() => setOpen((prev) => !prev)}>
        Alerts ({notifications.length})
      </button>
      {open ? (
        <div className="notification-card">
          <div className="notification-head">
            <strong>Notifications</strong>
            <button className="link-btn" onClick={clearNotifications}>Clear</button>
          </div>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map((item, index) => (
              <div key={`${item.title || "n"}-${index}`} className="notification-item">
                <strong>{item.title || "Message"}</strong>
                <p>{item.body || "New update"}</p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
