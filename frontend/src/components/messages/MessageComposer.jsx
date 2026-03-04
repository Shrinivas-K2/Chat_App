import { useMemo, useRef, useState } from "react";
import { createAttachmentPayload } from "../../features/messages/utils/attachmentPayload";

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

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export function MessageComposer({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const canSend = useMemo(() => text.trim().length > 0 && !isUploading, [text, isUploading]);

  const handleSend = async () => {
    if (!canSend) return;
    const nextText = text.trim();
    setAttachmentError("");
    await Promise.resolve(onSend({ text: nextText, messageType: "TEXT" }));
    setText("");
    onTyping(false);
  };

  const sendAttachment = async (file, kind) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError("File is too large. Max allowed size is 5 MB.");
      return;
    }

    setAttachmentError("");
    setIsUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const messageType = kind === "image" ? "IMAGE" : "FILE";
      const payloadText = createAttachmentPayload({
        kind,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl,
      });

      await Promise.resolve(
        onSend({
          text: payloadText,
          messageType,
        })
      );
      onTyping(false);
    } catch {
      setAttachmentError("Unable to process this file. Please try another file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await sendAttachment(file, "image");
  };

  const handleFilePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await sendAttachment(file, "file");
  };

  const handleTextKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    // Send only on Ctrl/Cmd + Enter. Plain Enter should remain a newline.
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="composer">
      {attachmentError ? <p className="error-text">{attachmentError}</p> : null}
      {isUploading ? <p className="info-text">Uploading attachment...</p> : null}

      <div className="media-row">
        <button
          className="media-btn"
          onClick={() => imageInputRef.current?.click()}
          type="button"
          title="Send image"
          disabled={isUploading}
        >
          {"\u{1F4F7}"}
        </button>
        <button
          className="media-btn"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          title="Send file"
          disabled={isUploading}
        >
          {"\u{1F4CE}"}
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
          placeholder="Write a message... (Ctrl/Cmd + Enter to send)"
          value={text}
          onKeyDown={handleTextKeyDown}
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
