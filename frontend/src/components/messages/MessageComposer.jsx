import { useMemo, useRef, useState } from "react";

const QUICK_EMOJIS = [
  "\u{1F600}",
  "\u{1F602}",
  "\u{1F60D}",
  "\u{1F64F}",
  "\u{1F44D}",
  "\u{1F389}",
  "\u{1F525}",
  "\u{2764}\u{FE0F}",
];

export function MessageComposer({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const handleSend = () => {
    if (!canSend) return;
    onSend({ text: text.trim(), messageType: "TEXT" });
    setText("");
    onTyping(false);
  };

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onSend({
      text: `Image: ${file.name}`,
      messageType: "IMAGE",
    });
    event.target.value = "";
    onTyping(false);
  };

  const handleFilePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onSend({
      text: `File: ${file.name}`,
      messageType: "FILE",
    });
    event.target.value = "";
    onTyping(false);
  };

  const handleVoicePlaceholder = () => {
    onSend({
      text: "Voice message",
      messageType: "VOICE",
    });
    onTyping(false);
  };

  return (
    <div className="composer">
      <div className="media-row">
        <button
          className="media-btn"
          onClick={() => imageInputRef.current?.click()}
          type="button"
          title="Send image"
        >
          {"\u{1F4F7}"}
        </button>
        <button
          className="media-btn"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          title="Send file"
        >
          {"\u{1F4CE}"}
        </button>
        <button
          className="media-btn"
          onClick={handleVoicePlaceholder}
          type="button"
          title="Send voice note"
        >
          {"\u{1F3A4}"}
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={handleImagePick}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden-input"
          onChange={handleFilePick}
        />
      </div>

      <div className="emoji-row">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="emoji-btn"
            onClick={() => setText((prev) => `${prev}${emoji}`)}
            type="button"
          >
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
        <button className="btn btn-primary" onClick={handleSend} disabled={!canSend} type="button">
          Send
        </button>
      </div>
    </div>
  );
}
