"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandWord } from "@/components/Brand";
import { IconCheck } from "@/components/Icons";

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Banking Services", links: ["Personal Checking", "Savings Account", "Consumer Lending", "Virtual Cards"] },
  { title: "Resources", links: ["Privacy Policy", "Statements", "Help Center", "Loan Calculator"] },
];

export function MarketingFooter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "rgba(4,7,11,0.85)" }}>
      <div className="shell" style={{ paddingTop: 56, paddingBottom: 40 }}>
        <div className="footer-grid">
          <div>
            <BrandWord size={32} />
            <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 16, maxWidth: 300 }}>
              Vintage Bank — providing innovative banking solutions that help you achieve your
              financial goals.
            </p>
            <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
              {["Member FDIC", "Equal Housing Lender", "256-bit SSL Encryption"].map((b) => (
                <span key={b} className="flex items-center gap-sm" style={{ color: "var(--text-2)", fontSize: 13 }}>
                  <span className="text-neon"><IconCheck width={15} height={15} /></span>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 style={{ fontSize: 14, color: "var(--text-0)", marginBottom: 16, letterSpacing: "0.02em" }}>{col.title}</h4>
              <ul style={{ listStyle: "none", display: "grid", gap: 11 }}>
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href="/login" style={{ color: "var(--text-2)", fontSize: 14 }} className="foot-link">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 style={{ fontSize: 14, color: "var(--text-0)", marginBottom: 16 }}>Contact Us</h4>
            <ul style={{ listStyle: "none", display: "grid", gap: 11, color: "var(--text-2)", fontSize: 14 }}>
              <li>support@firstrevoluteinc.com</li>
              <li className="mono">+1 555 0123</li>
              <li>Broadway Hall, Broadway,<br />Horsforth, Leeds LS18 4RS,<br />United Kingdom</li>
            </ul>
          </div>
        </div>

        <div className="footer-news">
          <div>
            <h4 style={{ fontSize: 15, color: "var(--text-0)", marginBottom: 4 }}>Stay updated</h4>
            <p style={{ color: "var(--text-2)", fontSize: 13.5 }}>Get the latest news and financial tips in your inbox.</p>
          </div>
          <form
            className="flex gap-sm"
            style={{ minWidth: 280 }}
            onSubmit={(e) => { e.preventDefault(); if (email) setDone(true); }}
          >
            <input
              className="input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              {done ? "Subscribed ✓" : "Subscribe"}
            </button>
          </form>
        </div>

        <div
          className="flex items-center justify-between wrap gap-md"
          style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", color: "var(--text-3)", fontSize: 13 }}
        >
          <span>© {new Date().getFullYear()} Vintage Bank. All rights reserved.</span>
          <span className="flex gap-md">
            <Link href="/" className="foot-link">Terms</Link>
            <Link href="/" className="foot-link">Privacy</Link>
            <Link href="/" className="foot-link">Bank Security</Link>
          </span>
        </div>
      </div>

      <style>{`
        .footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.2fr; gap: 40px; }
        .footer-news { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-top: 44px; padding: 22px 24px; border: 1px solid var(--border); border-radius: 16px; background: var(--panel); }
        .foot-link { transition: color 0.2s; }
        .foot-link:hover { color: var(--neon-bright); }
        @media (max-width: 860px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media (max-width: 520px) {
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </footer>
  );
}
