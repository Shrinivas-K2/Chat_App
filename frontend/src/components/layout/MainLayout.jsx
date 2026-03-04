import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { UserSearch } from "../search/UserSearch";
import { NotificationPanel } from "../notifications/NotificationPanel";
import { RequestPanel } from "../notifications/RequestPanel";
import { ToastStack } from "../notifications/ToastStack";
import { Avatar } from "../common/Avatar";
import { BrandLogo } from "../common/BrandLogo";
import { logoutApi } from "../../features/auth/api/authApi";

const THEME_STORAGE_KEY = "chat_app_theme";

export function MainLayout({ children, headerAction = null }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Always clear local auth, even when server logout fails.
    }
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const isDark = theme === "dark";

  return (
    <div className={`main-shell ${isDark ? "theme-dark" : "theme-light"}`.trim()}>
      <header className="main-header">
        <Link className="brand brand-link" to="/chat">
          <BrandLogo size="sm" text="Chat App" />
        </Link>
        <UserSearch />
        {headerAction ? <div className="header-mid-action">{headerAction}</div> : null}
        <div className="header-actions">
          <button
            className={`mini-btn header-pill theme-toggle-btn ${isDark ? "is-dark" : ""}`.trim()}
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            type="button"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? "Light" : "Dark"}
          </button>
          <RequestPanel />
          <NotificationPanel />
          <div className="corner-menu" ref={menuRef}>
            <button
              className={`corner-menu-btn ${menuOpen ? "is-open" : ""}`.trim()}
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="corner-menu-icon" aria-hidden="true">
                {"\u22EE"}
              </span>
            </button>
            {menuOpen ? (
              <div className="corner-menu-popover">
                <Link className="corner-menu-item" to="/chat" onClick={() => setMenuOpen(false)}>
                  Chat
                </Link>
                <Link className="corner-menu-item" to="/profile" onClick={() => setMenuOpen(false)}>
                  <Avatar text={user?.avatar || "U"} size="sm" />
                  <span>{user?.name || "Profile"}</span>
                </Link>
                <button className="corner-menu-item corner-menu-item-danger" onClick={handleLogout} type="button">
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <ToastStack />
      <main className="main-content">{children}</main>
    </div>
  );
}
