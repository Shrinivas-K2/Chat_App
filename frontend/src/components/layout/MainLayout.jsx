import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { UserSearch } from "../search/UserSearch";
import { NotificationPanel } from "../notifications/NotificationPanel";
import { RequestPanel } from "../notifications/RequestPanel";
import { ToastStack } from "../notifications/ToastStack";
import { Avatar } from "../common/Avatar";
import { logoutApi } from "../../features/auth/api/authApi";

export function MainLayout({ children, headerAction = null }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Always clear local auth, even when server logout fails.
    }
    logout();
    navigate("/login");
  };

  return (
    <div className="main-shell">
      <header className="main-header">
        <Link className="brand brand-link" to="/chat">
          Chat App
        </Link>
        <UserSearch />
        {headerAction ? <div className="header-mid-action">{headerAction}</div> : null}
        <div className="header-actions">
          <RequestPanel />
          <NotificationPanel />
          <Link
            className="link-btn"
            to="/chat"
            onMouseUp={(event) => event.currentTarget.blur()}
          >
            Chat
          </Link>
          <Link
            className="profile-link"
            to="/profile"
            onMouseUp={(event) => event.currentTarget.blur()}
          >
            <Avatar text={user?.avatar || "U"} size="sm" />
            <span>{user?.name || "Profile"}</span>
          </Link>
          <button
            className="link-btn"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </header>
      <ToastStack />
      <main className="main-content">{children}</main>
    </div>
  );
}
