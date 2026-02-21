import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function RequireGenderRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user?.gender) {
    return <Navigate to="/onboarding/gender" replace />;
  }

  return <Outlet />;
}
