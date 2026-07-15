"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { BrandMark } from "@/components/Brand";
import { IconBell, IconMenu, IconClose } from "@/components/Icons";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="center-screen">
        <BrandMark size={48} />
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-grid">
      {/* Desktop sidebar */}
      <div className="app-sidebar">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="drawer card">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main column */}
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="btn btn-ghost mobile-only"
            style={{ padding: 9, borderRadius: 10 }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <IconClose width={18} height={18} /> : <IconMenu width={18} height={18} />}
          </button>
          <div className="flex items-center gap-sm" style={{ color: "var(--text-2)", fontSize: 13.5 }}>
            <span
              className="badge-dot"
              style={{ background: "var(--neon)", boxShadow: "0 0 8px var(--neon)" }}
            />
            Secure session · {user.email}
          </div>
          <div className="flex items-center gap-sm" style={{ marginLeft: "auto" }}>
            <button className="btn btn-ghost" style={{ padding: 9, borderRadius: 10 }} aria-label="Notifications">
              <IconBell width={18} height={18} />
            </button>
          </div>
        </header>

        <main className="app-content fade-up">{children}</main>
      </div>

      <style>{`
        .app-grid { display: grid; grid-template-columns: 272px 1fr; min-height: 100vh; }
        .app-sidebar {
          position: sticky; top: 0; height: 100vh;
          border-right: 1px solid var(--border);
          background: var(--nav-bg);
          backdrop-filter: blur(12px);
        }
        .app-main { display: flex; flex-direction: column; min-width: 0; }
        .app-topbar {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; gap: 14px;
          padding: 16px 28px;
          border-bottom: 1px solid var(--border);
          background: var(--nav-bg);
          backdrop-filter: blur(12px);
        }
        .app-content { padding: 32px 28px 60px; max-width: 1180px; width: 100%; margin: 0 auto; }
        .mobile-only { display: none; }
        .drawer-overlay { position: fixed; inset: 0; z-index: 40; background: var(--overlay); backdrop-filter: blur(4px); }
        .drawer {
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 50; width: 280px;
          border-radius: 0 18px 18px 0;
        }
        @media (max-width: 960px) {
          .app-grid { grid-template-columns: 1fr; }
          .app-sidebar { display: none; }
          .mobile-only { display: inline-flex; }
          .app-content { padding: 22px 18px 60px; }
          .app-topbar { padding: 14px 18px; }
        }
      `}</style>
    </div>
  );
}
