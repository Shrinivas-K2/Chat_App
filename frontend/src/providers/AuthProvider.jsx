import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { meApi } from "../features/auth/api/authApi";

export function AuthProvider({ children }) {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    let active = true;

    meApi()
      .then((data) => {
        if (!active) return;
        updateProfile(data.user);
      })
      .catch(() => {
        if (!active) return;
        logout();
      });

    return () => {
      active = false;
    };
  }, [hydrated, isAuthenticated, updateProfile, logout]);

  return children;
}
