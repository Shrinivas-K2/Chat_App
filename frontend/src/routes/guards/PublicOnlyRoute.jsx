import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.gender ? "/chat" : "/onboarding/gender"} replace />;
  }

  return <Outlet />;
}
