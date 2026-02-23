import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_BUTTON_WIDTH = 320;

let googleScriptPromise;

function loadGoogleScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is not available in this environment"));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google script")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function GoogleAuthButton({ onCredential, isSubmitting }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [googleError, setGoogleError] = useState("");
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let cancelled = false;

    async function setupGoogleButton() {
      setGoogleError("");

      try {
        await loadGoogleScript();

        if (cancelled || !window.google?.accounts?.id || !buttonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (!response?.credential) {
              setGoogleError("Google sign-in did not return a valid credential.");
              return;
            }

            onCredentialRef.current(response.credential);
          },
          ux_mode: "popup",
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: GOOGLE_BUTTON_WIDTH,
        });
      } catch (error) {
        if (!cancelled) {
          setGoogleError("Unable to load Google sign-in right now.");
        }
      }
    }

    setupGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  if (!googleClientId) {
    return null;
  }

  return (
    <div className="auth-google-wrap">
      <div className="auth-divider">
        <span>or</span>
      </div>

      <div className="google-button-shell" aria-disabled={isSubmitting}>
        <div ref={buttonRef} />
        {isSubmitting ? <div className="google-button-overlay" aria-hidden="true" /> : null}
      </div>

      {googleError ? <p className="error-text">{googleError}</p> : null}
    </div>
  );
}
