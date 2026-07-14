"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { BrandWord } from "@/components/Brand";
import { IconGlobe, IconMenu, IconClose } from "@/components/Icons";

const PERSONAL: [string, string, string][] = [
  ["Personal Checking", "Everyday spending, zero friction", "/personal/checking"],
  ["Savings Account", "Grow with confidence", "/personal/savings"],
  ["Consumer Lending", "Borrow on your terms", "/personal/lending"],
  ["Virtual Cards", "Issue in seconds", "/login"],
];
const SECURITY: [string, string, string][] = [
  ["ICS/CDARS FDIC Coverage", "Protection beyond $250,000", "/security/ics-cdars"],
  ["Anti-Fraud Protection", "Real-time monitoring", "/security/ics-cdars"],
  ["256-bit Encryption", "Bank-grade security", "/security/ics-cdars"],
];

export function MarketingNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="mkt-nav">
      <div className="shell mkt-nav-inner">
        <Link href="/" onClick={() => setOpen(false)}>
          <BrandWord size={32} />
        </Link>

        <div className="mkt-links">
          <Link href="/" className="mkt-link">Home</Link>
          <Link href="/about" className="mkt-link">About</Link>

          <div className="mkt-has-drop" style={{ position: "relative" }}>
            <button className="mkt-link">
              Personal <Caret />
            </button>
            <div className="mkt-dropdown">
              {PERSONAL.map(([t, s, href]) => (
                <Link key={t} href={href} className="mkt-drop-item">
                  {t}
                  <small>{s}</small>
                </Link>
              ))}
            </div>
          </div>

          <div className="mkt-has-drop" style={{ position: "relative" }}>
            <button className="mkt-link">
              Security <Caret />
            </button>
            <div className="mkt-dropdown">
              {SECURITY.map(([t, s, href]) => (
                <Link key={t} href={href} className="mkt-drop-item">
                  {t}
                  <small>{s}</small>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button className="lang-pill desktop-only" title="Select language">
            <IconGlobe width={15} height={15} /> EN
          </button>
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary btn-sm desktop-only">
            {user ? "Dashboard" : "Login"}
          </Link>
          <button
            className="btn btn-ghost mkt-burger"
            style={{ padding: 9, borderRadius: 10 }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <IconClose width={18} height={18} /> : <IconMenu width={18} height={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mkt-mobile">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <div style={{ padding: "10px 16px 4px", color: "var(--text-3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Personal</div>
          {PERSONAL.map(([t, , href]) => (
            <Link key={t} href={href} onClick={() => setOpen(false)}>{t}</Link>
          ))}
          <div style={{ padding: "10px 16px 4px", color: "var(--text-3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Security</div>
          {SECURITY.map(([t, , href]) => (
            <Link key={t} href={href} onClick={() => setOpen(false)}>{t}</Link>
          ))}
          <div style={{ marginTop: 16 }}>
            <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              {user ? "Go to dashboard" : "Login"}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Caret() {
  return (
    <svg width="10" height="6" viewBox="0 0 12 8" fill="none" style={{ opacity: 0.7 }}>
      <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
