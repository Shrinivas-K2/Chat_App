import { create } from "zustand";
import { authStorage } from "../services/storage/authStorage";
import { useChatStore } from "./chatStore";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  hydrateFromStorage: () => {
    const auth = authStorage.get();
    if (!auth?.token || !auth?.user) {
      set({ hydrated: true });
      return;
    }

    set({
      token: auth.token,
      user: auth.user,
      isAuthenticated: true,
      hydrated: true,
    });
  },

  login: ({ token, user }) => {
    authStorage.set({ token, user });
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    authStorage.clear();
    useChatStore.getState().reset();
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateProfile: (user) => {
    set((state) => {
      const nextUser = { ...state.user, ...user };
      if (state.token) {
        authStorage.set({ token: state.token, user: nextUser });
      }

      return { user: nextUser };
    });
  },
}));
