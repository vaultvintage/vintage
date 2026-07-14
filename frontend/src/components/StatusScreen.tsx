import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "./Brand";

/** Centered, on-brand full-screen message used by error boundaries & 404. */
export function StatusScreen({
  code,
  title,
  message,
  primary,
  secondary,
}: {
  code?: string;
  title: string;
  message: string;
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <main className="center-screen" style={{ padding: 24, textAlign: "center" }}>
      <BrandMark size={52} />
      {code && (
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 72,
            lineHeight: 1,
            color: "var(--neon)",
            textShadow: "0 0 40px var(--neon-glow)",
          }}
        >
          {code}
        </div>
      )}
      <h1 style={{ fontSize: 26 }}>{title}</h1>
      <p style={{ color: "var(--text-2)", maxWidth: 420 }}>{message}</p>
      <div className="flex items-center gap-md" style={{ marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {primary}
        {secondary ?? (
          <Link href="/" className="btn btn-ghost">
            Back to home
          </Link>
        )}
      </div>
    </main>
  );
}
