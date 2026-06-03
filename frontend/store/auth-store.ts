import { create } from "zustand";

export interface User {
  username: string;
  name: string;
  role: "admin" | "user" | "guest";
  level: string;
  avatar: string;
  color: string;
  scope: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (userData: User) => void;
  logout: () => void;
  initialize: () => void;
  updateUserLocal: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  login: (userData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rf_user_name", userData.name);
      localStorage.setItem("rf_user_username", userData.username);
      localStorage.setItem("rf_user_role", userData.role);
      localStorage.setItem("rf_user_level", userData.level);
      localStorage.setItem("rf_user_avatar", userData.avatar);
      localStorage.setItem("rf_user_color", userData.color || "");
      localStorage.setItem("rf_user_scope", userData.scope || "");
      localStorage.setItem("rf_authenticated", "true");
    }
    set({ user: userData, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rf_user_name");
      localStorage.removeItem("rf_user_username");
      localStorage.removeItem("rf_user_role");
      localStorage.removeItem("rf_user_level");
      localStorage.removeItem("rf_user_avatar");
      localStorage.removeItem("rf_user_color");
      localStorage.removeItem("rf_user_scope");
      localStorage.removeItem("rf_authenticated");
    }
    set({ user: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("rf_authenticated");
      const name = localStorage.getItem("rf_user_name");
      const username = localStorage.getItem("rf_user_username");
      const role = localStorage.getItem("rf_user_role") as "admin" | "user" | "guest" | null;
      const level = localStorage.getItem("rf_user_level");
      const avatar = localStorage.getItem("rf_user_avatar");
      const color = localStorage.getItem("rf_user_color");
      const scope = localStorage.getItem("rf_user_scope");

      if (auth === "true" && name && username && role) {
        set({
          user: {
            username,
            name,
            role,
            level: level || "",
            avatar: avatar || "",
            color: color || "",
            scope: scope || ""
          },
          isAuthenticated: true,
          isInitialized: true
        });
      } else {
        set({ user: null, isAuthenticated: false, isInitialized: true });
      }
    }
  },
  updateUserLocal: (userData) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...userData };
      if (typeof window !== "undefined") {
        if (userData.name) localStorage.setItem("rf_user_name", userData.name);
        if (userData.username) localStorage.setItem("rf_user_username", userData.username);
        if (userData.role) localStorage.setItem("rf_user_role", userData.role);
        if (userData.level) localStorage.setItem("rf_user_level", userData.level);
        if (userData.avatar) localStorage.setItem("rf_user_avatar", userData.avatar);
        if (userData.color) localStorage.setItem("rf_user_color", userData.color);
        if (userData.scope) localStorage.setItem("rf_user_scope", userData.scope);
      }
      return { user: updated };
    });
  }
}));
