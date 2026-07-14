"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, humanizeError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { AuthShell } from "@/components/AuthShell";
import { Alert, Field } from "@/components/ui";
import { IconCheck } from "@/components/Icons";

const OCCUPATIONS = ["Employed", "Unemployed", "Student", "Other"];
const GENDERS = ["Male", "Female"];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    gender: "Male",
    occupation: "Employed",
    country: "",
    city: "",
    state: "",
    zip_code: "",
    residential_address: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function next(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.phone_number) delete (payload as any).phone_number;
      await api.register(payload);
      toast.success("Account created", "Welcome to Vintage Bank!");
      // Auto sign-in for a seamless flow.
      try {
        await login(form.email, form.password);
        router.push("/dashboard");
      } catch {
        router.push("/login");
      }
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Couldn't create account", msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      side={
        <>
          <h2 style={{ fontSize: 30, marginBottom: 14 }}>Open your account.</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15.5, marginBottom: 24 }}>
            A few details and your private wallet is ready — no branches, no queues.
          </p>
          <ul style={{ listStyle: "none", display: "grid", gap: 12 }}>
            {["Instant wallet & account number", "Issue virtual cards on demand", "OTP-secured transfers"].map(
              (t) => (
                <li key={t} className="flex items-center gap-sm" style={{ color: "var(--text-1)" }}>
                  <span className="text-neon"><IconCheck width={18} height={18} /></span>
                  {t}
                </li>
              )
            )}
          </ul>
        </>
      }
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span className="eyebrow">Create account</span>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>Step {step} of 2</span>
      </div>
      <h1 style={{ fontSize: 28, marginBottom: 22 }}>
        {step === 1 ? "Tell us about you" : "Where you're based"}
      </h1>

      {error && <Alert>{error}</Alert>}

      {step === 1 ? (
        <form onSubmit={next}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="First name">
              <input className="input" value={form.first_name} onChange={set("first_name")} required />
            </Field>
            <Field label="Last name">
              <input className="input" value={form.last_name} onChange={set("last_name")} required />
            </Field>
          </div>
          <Field label="Email">
            <input className="input" type="email" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="Phone number" hint="Optional · format +999999999">
            <input className="input" value={form.phone_number} onChange={set("phone_number")} placeholder="+14155550123" />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <input className="input" type="password" value={form.password} onChange={set("password")} minLength={8} required />
          </Field>
          <button className="btn btn-primary btn-block">Continue</button>
        </form>
      ) : (
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Gender">
              <select className="select" value={form.gender} onChange={set("gender")}>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Occupation">
              <select className="select" value={form.occupation} onChange={set("occupation")}>
                {OCCUPATIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Country">
              <input className="input" value={form.country} onChange={set("country")} />
            </Field>
            <Field label="City">
              <input className="input" value={form.city} onChange={set("city")} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="State">
              <input className="input" value={form.state} onChange={set("state")} />
            </Field>
            <Field label="Zip code">
              <input className="input" value={form.zip_code} onChange={set("zip_code")} />
            </Field>
          </div>
          <Field label="Residential address">
            <textarea className="textarea" value={form.residential_address} onChange={set("residential_address")} />
          </Field>
          <div className="flex gap-md">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>
              Back
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" /> : "Create account"}
            </button>
          </div>
        </form>
      )}

      <p style={{ marginTop: 22, color: "var(--text-2)", fontSize: 14 }}>
        Already have an account?{" "}
        <Link href="/login" className="text-neon" style={{ fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
