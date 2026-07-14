"use client";

import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import type { User } from "@/lib/types";
import { Alert, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconCheck, IconShield, IconUser } from "@/components/Icons";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    middle_name: user?.middle_name ?? "",
    last_name: user?.last_name ?? "",
    phone_number: user?.phone_number ?? "",
    occupation: user?.occupation ?? "Other",
    gender: user?.gender ?? "Male",
    country: user?.country ?? "",
    city: user?.city ?? "",
    state: user?.state ?? "",
    zip_code: user?.zip_code ?? "",
    residential_address: user?.residential_address ?? "",
  });

  const set = (k: keyof typeof form) => (e: any) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const updated = (await api.updateUser(user.id, form)) as User;
      setUser({ ...user, ...updated });
      setMsg("Profile updated.");
      toast.success("Profile saved", "Your details were updated.");
    } catch (error) {
      const m = humanizeError(error);
      setErr(m);
      toast.error("Couldn't save profile", m);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Account</span>
        <h1 style={{ marginTop: 8 }}>Profile & security</h1>
        <p>Keep your details current and verify your transaction PIN.</p>
      </div>

      <div className="grid gap-md profile-grid" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
        <div className="card card-pad">
          {msg && <Alert kind="success"><IconCheck width={16} height={16} />{msg}</Alert>}
          {err && <Alert>{err}</Alert>}

          <form onSubmit={save}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field label="First name"><input className="input" value={form.first_name} onChange={set("first_name")} /></Field>
              <Field label="Middle name"><input className="input" value={form.middle_name} onChange={set("middle_name")} /></Field>
              <Field label="Last name"><input className="input" value={form.last_name} onChange={set("last_name")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Phone number"><input className="input" value={form.phone_number ?? ""} onChange={set("phone_number")} /></Field>
              <Field label="Gender">
                <select className="select" value={form.gender} onChange={set("gender")}>
                  <option>Male</option><option>Female</option>
                </select>
              </Field>
            </div>
            <Field label="Occupation">
              <select className="select" value={form.occupation} onChange={set("occupation")}>
                {["Employed", "Unemployed", "Student", "Other"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Country"><input className="input" value={form.country} onChange={set("country")} /></Field>
              <Field label="City"><input className="input" value={form.city} onChange={set("city")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="State"><input className="input" value={form.state} onChange={set("state")} /></Field>
              <Field label="Zip code"><input className="input" value={form.zip_code} onChange={set("zip_code")} /></Field>
            </div>
            <Field label="Residential address">
              <textarea className="textarea" value={form.residential_address} onChange={set("residential_address")} />
            </Field>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : "Save changes"}
            </button>
          </form>
        </div>

        <div className="grid gap-md">
          {/* Identity card */}
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <span
              style={{
                display: "inline-flex",
                width: 72,
                height: 72,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                background: "rgba(61,255,154,0.16)",
                border: "1px solid var(--border-strong)",
                color: "var(--neon-bright)",
                fontWeight: 700,
                fontSize: 26,
                fontFamily: "var(--font-serif)",
              }}
            >
              {initials(user?.first_name, user?.last_name)}
            </span>
            <h3 style={{ fontSize: 19 }}>{user?.first_name} {user?.last_name}</h3>
            <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 12 }}>{user?.email}</p>
            <span className={`badge ${user?.pin_verified ? "badge-success" : "badge-pending"}`}>
              <span className="badge-dot" />
              {user?.pin_verified ? "PIN verified" : "PIN not verified"}
            </span>
          </div>

          <PinCard verified={!!user?.pin_verified} onVerified={() => user && setUser({ ...user, pin_verified: true })} />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .card-pad .grid, .card-pad [style*="1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </>
  );
}

function PinCard({ verified, onVerified }: { verified: boolean; onVerified: () => void }) {
  const toast = useToast();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(verified);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.verifyPin(pin);
      setOk(true);
      onVerified();
      toast.success("PIN verified", "Your transaction PIN is confirmed.");
    } catch (error) {
      const m = humanizeError(error);
      setErr(m);
      toast.error("Invalid PIN", m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-sm" style={{ marginBottom: 10 }}>
        <span className="text-neon"><IconShield /></span>
        <h3 style={{ fontSize: 17 }}>Transaction PIN</h3>
      </div>
      {ok ? (
        <div className="flex items-center gap-sm" style={{ color: "var(--neon-bright)", fontSize: 14 }}>
          <IconCheck width={18} height={18} /> Your PIN is verified.
        </div>
      ) : (
        <>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 14 }}>
            Enter your 4-digit PIN (emailed when you registered) to verify it.
          </p>
          {err && <Alert>{err}</Alert>}
          <form onSubmit={verify}>
            <input
              className="input mono"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              style={{ letterSpacing: "0.5em", textAlign: "center", fontSize: 20, marginBottom: 12 }}
            />
            <button className="btn btn-primary btn-block" disabled={busy || pin.length !== 4}>
              {busy ? <span className="spinner" /> : "Verify PIN"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
