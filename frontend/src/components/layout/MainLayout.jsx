import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { UserSearch } from "../search/UserSearch";
import { NotificationPanel } from "../notifications/NotificationPanel";
import { RequestPanel } from "../notifications/RequestPanel";
import { Avatar } from "../common/Avatar";
import { logoutApi } from "../../features/auth/api/authApi";

export function MainLayout({ children }) {
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
        <div className="brand">Chat App</div>
        <UserSearch />
        <div className="header-actions">
          <RequestPanel />
          <NotificationPanel />
          <Link className="profile-link" to="/profile">
            <Avatar text={user?.avatar || "U"} size="sm" />
            <span>{user?.name || "Profile"}</span>
          </Link>
          <button className="link-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
