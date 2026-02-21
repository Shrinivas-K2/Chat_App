import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function GenderSetupOnlyRoute() {
  const user = useAuthStore((state) => state.user);

  if (user?.gender) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
