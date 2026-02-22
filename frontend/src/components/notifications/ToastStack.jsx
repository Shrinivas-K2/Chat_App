import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/chatStore";

const TOAST_DURATION_MS = 3800;

function toastKey(item, index) {
  return `${item.timestamp || ""}-${item.title || ""}-${item.body || ""}-${index}`;
}

export function ToastStack() {
  const notifications = useChatStore((state) => state.notifications);
  const [toasts, setToasts] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    const latest = notifications.slice(0, 4);
    latest.forEach((item, index) => {
      const key = toastKey(item, index);
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);

      const id = `${key}-${Date.now()}`;
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: item.title || "Notification",
          body: item.body || "New update",
        },
      ]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, TOAST_DURATION_MS);
    });
  }, [notifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-card">
          <div className="toast-title">{toast.title}</div>
          <p className="toast-body">{toast.body}</p>
          <button
            className="toast-close"
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
            type="button"
            aria-label="Close notification"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
