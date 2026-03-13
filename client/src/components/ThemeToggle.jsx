import { motion } from "framer-motion";
import { useThemeStore } from "../store/useThemeStore";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      initial={false}
      animate={{
        backgroundColor: isDark ? "#1e1b4b" : "#f3f4f6",
        borderColor: isDark ? "#4338ca" : "#d1d5db",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow-md overflow-hidden cursor-pointer"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-300" />
        ) : (
          <Sun className="w-4 h-4 text-yellow-500" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
