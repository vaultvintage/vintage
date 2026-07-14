"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWord } from "./Brand";
import {
  IconArrowDown,
  IconCard,
  IconCrypto,
  IconDashboard,
  IconList,
  IconLoan,
  IconLogout,
  IconTransfer,
  IconUser,
} from "./Icons";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: <IconDashboard /> },
  { href: "/deposit", label: "Add Funds", icon: <IconArrowDown /> },
  { href: "/transactions", label: "Transactions", icon: <IconList /> },
  { href: "/transfers", label: "Transfers", icon: <IconTransfer /> },
  { href: "/cards", label: "Virtual Cards", icon: <IconCard /> },
  { href: "/loans", label: "Loans", icon: <IconLoan /> },
  { href: "/withdrawals", label: "Crypto Cash-out", icon: <IconCrypto /> },
  { href: "/profile", label: "Profile", icon: <IconUser /> },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "22px 18px",
      }}
    >
      <div style={{ padding: "4px 8px 22px" }}>
        <Link href="/dashboard" onClick={onNavigate}>
          <BrandWord size={34} />
        </Link>
      </div>

      <nav style={{ display: "grid", gap: 4, flex: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="nav-item"
              data-active={active}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {active && <span className="nav-dot" />}
            </Link>
          );
        })}
      </nav>

      <div
        className="card"
        style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}
      >
        <span className="avatar">{initials(user?.first_name, user?.last_name)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-0)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.first_name} {user?.last_name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-2)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.email}
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ padding: 9, borderRadius: 10 }}
          aria-label="Log out"
          title="Log out"
        >
          <IconLogout width={17} height={17} />
        </button>
      </div>

      <style>{`
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          color: var(--text-2);
          font-weight: 500;
          font-size: 14.5px;
          position: relative;
          transition: all 0.22s var(--ease);
          border: 1px solid transparent;
        }
        .nav-item:hover { color: var(--text-0); background: rgba(61,255,154,0.05); }
        .nav-item[data-active="true"] {
          color: var(--neon-bright);
          background: rgba(61,255,154,0.08);
          border-color: var(--border-strong);
        }
        .nav-icon { display: inline-flex; }
        .nav-item[data-active="true"] .nav-icon { color: var(--neon); filter: drop-shadow(0 0 6px var(--neon-glow)); }
        .nav-dot { margin-left: auto; width: 6px; height: 6px; border-radius: 50%; background: var(--neon); box-shadow: 0 0 8px var(--neon); }
        .avatar {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: rgba(61,255,154,0.16);
          border: 1px solid var(--border-strong);
          color: var(--neon-bright); font-weight: 700; font-size: 14px;
        }
      `}</style>
    </aside>
  );
}
