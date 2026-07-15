"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * Inline script injected into <head> before paint so the correct theme is
 * applied on the very first frame — prevents a light/dark flash (FOUC).
 * Default is "light" (bright) when nothing is stored.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}')||'light';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d)r.setAttribute('data-theme','dark');else r.removeAttribute('data-theme');}catch(e){}})();`;

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(pref: ThemePref): ResolvedTheme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
}

type ThemeCtx = {
  theme: ThemePref; // the user's preference
  resolved: ResolvedTheme; // the theme actually shown
  setTheme: (t: ThemePref) => void;
  toggle: () => void; // quick light <-> dark flip
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Read the stored preference on mount (client only).
  useEffect(() => {
    let stored: ThemePref = "light";
    try {
      const v = localStorage.getItem(STORAGE_KEY) as ThemePref | null;
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {
      /* ignore */
    }
    setThemeState(stored);
    setResolved(resolve(stored));
    apply(resolve(stored));
    // Enable color transitions only after the first paint, so the initial
    // load doesn't animate.
    requestAnimationFrame(() =>
      document.documentElement.classList.add("theme-ready")
    );
  }, []);

  // Follow the OS when the preference is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = systemPrefersDark() ? "dark" : "light";
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    const r = resolve(t);
    setResolved(r);
    apply(r);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
