import type { ReactNode } from "react";
import Link from "next/link";
import { BrandWord } from "./Brand";

export function AuthShell({
  children,
  side,
}: {
  children: ReactNode;
  side?: ReactNode;
}) {
  return (
    <main
      className="grid"
      style={{
        minHeight: "100vh",
        gridTemplateColumns: "minmax(0, 1fr)",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        className="grid"
        style={{
          width: "100%",
          maxWidth: 980,
          gridTemplateColumns: "1fr",
          gap: 0,
        }}
      >
        <div
          className="card fade-up"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            overflow: "hidden",
          }}
        >
          {/* Left — brand / narrative */}
          <div
            className="auth-aside"
            style={{
              padding: "44px 40px",
              borderRight: "1px solid var(--border)",
              background: "rgba(61,255,154,0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 520,
            }}
          >
            <Link href="/">
              <BrandWord />
            </Link>
            <div>
              {side ?? (
                <>
                  <h2 style={{ fontSize: 30, marginBottom: 14 }}>
                    Where your money moves with intent.
                  </h2>
                  <p style={{ color: "var(--text-2)", fontSize: 15.5 }}>
                    Secure transfers, instant virtual cards, and crypto cash-out —
                    wrapped in an interface designed to feel calm and certain.
                  </p>
                </>
              )}
            </div>
            <p style={{ color: "var(--text-3)", fontSize: 13 }}>
              256-bit encrypted · OTP protected · PIN verified
            </p>
          </div>

          {/* Right — form */}
          <div style={{ padding: "44px 40px" }}>{children}</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .auth-aside { display: none !important; }
          main .card { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
