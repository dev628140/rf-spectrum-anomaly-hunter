import { create } from "zustand";

interface User {
  username: string;
  role: "admin" | "user" | "guest";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (username: string, role: "admin" | "user" | "guest") => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  login: (username, role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rf_user_name", username);
      localStorage.setItem("rf_user_role", role);
      localStorage.setItem("rf_authenticated", "true");
    }
    set({ user: { username, role }, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rf_user_name");
      localStorage.removeItem("rf_user_role");
      localStorage.removeItem("rf_authenticated");
    }
    set({ user: null, isAuthenticated: false });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("rf_authenticated");
      const name = localStorage.getItem("rf_user_name");
      const role = localStorage.getItem("rf_user_role") as "admin" | "user" | "guest" | null;

      if (auth === "true" && name && role) {
        set({ user: { username: name, role }, isAuthenticated: true, isInitialized: true });
      } else {
        set({ user: null, isAuthenticated: false, isInitialized: true });
      }
    }
  },
}));
