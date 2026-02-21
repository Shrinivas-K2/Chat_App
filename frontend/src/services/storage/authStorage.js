const AUTH_STORAGE_KEY = "chat-app-auth";

export const authStorage = {
  get() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  set(data) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  },

  clear() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
