import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("aurachat-theme") || "dark",

  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aurachat-theme", theme);
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("aurachat-theme", newTheme);
      return { theme: newTheme };
    }),
}));
