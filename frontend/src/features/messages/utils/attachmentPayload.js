export const ATTACHMENT_PREFIX = "__CHAT_APP_ATTACHMENT__:";

export function createAttachmentPayload({ kind, fileName, mimeType, size, dataUrl }) {
  const safeKind = kind === "image" ? "image" : "file";
  const payload = {
    v: 1,
    kind: safeKind,
    fileName: String(fileName || "attachment").slice(0, 180),
    mimeType: String(mimeType || "application/octet-stream"),
    size: Number(size || 0),
    dataUrl: String(dataUrl || ""),
  };

  return `${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

export function parseAttachmentPayload(value) {
  const raw = String(value || "");
  if (!raw.startsWith(ATTACHMENT_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw.slice(ATTACHMENT_PREFIX.length));
    const kind = parsed?.kind === "image" ? "image" : parsed?.kind === "file" ? "file" : "";
    const dataUrl = String(parsed?.dataUrl || "");
    const fileName = String(parsed?.fileName || "attachment");
    const size = Number(parsed?.size || 0);
    const mimeType = String(parsed?.mimeType || "");

    if (!kind || !dataUrl.startsWith("data:")) {
      return null;
    }

    if (kind === "image" && !dataUrl.startsWith("data:image/")) {
      return null;
    }

    return {
      kind,
      dataUrl,
      fileName,
      size: Number.isFinite(size) ? size : 0,
      mimeType,
    };
  } catch {
    return null;
  }
}
