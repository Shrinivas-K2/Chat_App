import { useState } from "react";

function sizeClass(size) {
  if (size === "lg") return "brand-lockup-lg";
  if (size === "sm") return "brand-lockup-sm";
  return "brand-lockup-md";
}

export function BrandLogo({ text = "Chat App", size = "md" }) {
  const [imageError, setImageError] = useState(false);

  return (
    <span className={`brand-lockup ${sizeClass(size)}`.trim()}>
      {!imageError ? (
        <img
          className="brand-logo-img"
          src="/chatapp4u-logo.png"
          alt="Chat App logo"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="brand-logo-fallback" aria-hidden="true">
          C
        </span>
      )}
      <span className="brand-logo-text">{text}</span>
    </span>
  );
}
