"use client";

import { useTheme, type ThemePref } from "@/lib/theme";
import { IconSun, IconMoon, IconMonitor } from "./Icons";

const OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <IconSun width={15} height={15} /> },
  { value: "dark", label: "Dark", icon: <IconMoon width={15} height={15} /> },
  { value: "system", label: "System", icon: <IconMonitor width={15} height={15} /> },
];

/** Segmented Light / Dark / System control. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-seg" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          data-active={theme === o.value}
          className="theme-seg-btn"
          onClick={() => setTheme(o.value)}
          title={o.label}
          aria-label={o.label}
        >
          {o.icon}
          {!compact && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

/** Single icon button that flips light <-> dark. Handy for tight navs. */
export function ThemeSwitch() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ padding: 9, borderRadius: 10 }}
      onClick={toggle}
      title={dark ? "Switch to light" : "Switch to dark"}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />}
    </button>
  );
}
