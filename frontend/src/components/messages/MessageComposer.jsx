import { useMemo, useState } from "react";

const QUICK_EMOJIS = ["??", "??", "??", "??", "??"];

export function MessageComposer({ onSend, onTyping }) {
  const [text, setText] = useState("");

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    onTyping(false);
  };

  return (
    <div className="composer">
      <div className="emoji-row">
        {QUICK_EMOJIS.map((emoji) => (
          <button key={emoji} className="emoji-btn" onClick={() => setText((prev) => `${prev}${emoji}`)}>
            {emoji}
          </button>
        ))}
      </div>
      <div className="composer-row">
        <textarea
          className="composer-input"
          rows={2}
          placeholder="Write a message..."
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onTyping(event.target.value.length > 0);
          }}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!canSend}>
          Send
        </button>
      </div>
    </div>
  );
}
