export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "bacaxita_theme";

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const prefersDarkMode = () => {
  if (!isBrowser() || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const resolveInitialTheme = (): ThemeMode => {
  if (!isBrowser()) return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return prefersDarkMode() ? "dark" : "light";
};

export const readCurrentTheme = (): ThemeMode => {
  if (!isBrowser()) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const applyTheme = (mode: ThemeMode) => {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
};
