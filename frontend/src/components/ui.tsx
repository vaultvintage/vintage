"use client";

import { useEffect, type ReactNode } from "react";
import type { TxStatus } from "@/lib/types";
import type { ErrorKind } from "@/lib/api";
import { IconClose, IconGlobe, IconShield } from "./Icons";

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toUpperCase();
  const cls =
    s === "COMPLETED"
      ? "badge-success"
      : s === "FAILED"
      ? "badge-failed"
      : "badge-pending";
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status || "—"}
    </span>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0", color: "var(--text-2)" }}>
      <span className="spinner" />
      {label ?? "Loading…"}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        color: "var(--text-2)",
      }}
    >
      {icon && (
        <div
          style={{
            display: "inline-flex",
            padding: 16,
            borderRadius: 16,
            background: "rgba(61,255,154,0.06)",
            border: "1px solid var(--border)",
            color: "var(--neon)",
            marginBottom: 16,
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h3>
      {hint && <p style={{ maxWidth: 360, margin: "0 auto 16px" }}>{hint}</p>}
      {action}
    </div>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success";
  children: ReactNode;
}) {
  return <div className={`alert alert-${kind}`} role="alert">{children}</div>;
}

/** Full-panel error state with a retry action — for failed data loads. */
export function ErrorState({
  message,
  kind,
  onRetry,
  retrying,
}: {
  message: string;
  kind?: ErrorKind | null;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const isNetwork = kind === "network" || kind === "timeout";
  const title =
    kind === "network"
      ? "Can't reach the server"
      : kind === "timeout"
      ? "That took too long"
      : kind === "permission"
      ? "Access denied"
      : kind === "notfound"
      ? "Not found"
      : kind === "server"
      ? "Server error"
      : "Something went wrong";

  return (
    <div style={{ textAlign: "center", padding: "44px 24px", color: "var(--text-2)" }}>
      <div
        style={{
          display: "inline-flex",
          padding: 16,
          borderRadius: 16,
          background: "rgba(255,92,106,0.08)",
          border: "1px solid rgba(255,92,106,0.25)",
          color: "var(--danger)",
          marginBottom: 16,
        }}
      >
        {isNetwork ? <IconGlobe /> : <IconShield />}
      </div>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h3>
      <p style={{ maxWidth: 380, margin: "0 auto 18px" }}>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry} disabled={retrying}>
          {retrying ? <span className="spinner" /> : "Try again"}
        </button>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(2, 5, 8, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeUp 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: width }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}
        >
          <h3 style={{ fontSize: 19 }}>{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 8, borderRadius: 10 }}
            aria-label="Close"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  sub?: ReactNode;
}) {
  return (
    <div className="card card-hover card-pad">
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <span className="label" style={{ margin: 0 }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: accent ? "var(--neon)" : "var(--text-2)" }}>{icon}</span>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 26,
          color: accent ? "var(--neon-bright)" : "var(--text-0)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-2)" }}>{sub}</div>
      )}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {children}
      {hint && (
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>{hint}</div>
      )}
    </div>
  );
}
