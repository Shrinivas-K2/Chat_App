import { useEffect } from "react";

export function PopupDialog({ open, title, subtitle, children, onClose, tone = "default" }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="popup-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className={`popup-card ${tone === "danger" ? "popup-card-danger" : ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="popup-header">
          <h3 className="popup-title">{title}</h3>
          {subtitle ? <p className="popup-subtitle">{subtitle}</p> : null}
        </header>
        <div className="popup-body">{children}</div>
      </section>
    </div>
  );
}
