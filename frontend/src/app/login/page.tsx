"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { humanizeError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { AuthShell } from "@/components/AuthShell";
import { Alert, Field } from "@/components/ui";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired")) {
      setNotice("Your session expired. Please sign in again to continue.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Signed in", "Welcome back to Vintage Bank.");
      router.push("/dashboard");
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <span className="eyebrow">Welcome back</span>
      <h1 style={{ fontSize: 30, margin: "10px 0 6px" }}>Sign in</h1>
      <p style={{ color: "var(--text-2)", marginBottom: 28 }}>
        Use your email or phone number to continue.
      </p>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <form onSubmit={onSubmit}>
        <Field label="Email or phone">
          <input
            className="input"
            placeholder="you@example.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        <button className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 6 }}>
          {loading ? <span className="spinner" /> : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: 24, color: "var(--text-2)", fontSize: 14 }}>
        New to Vintage Bank?{" "}
        <Link href="/register" className="text-neon" style={{ fontWeight: 600 }}>
          Open an account
        </Link>
      </p>
    </AuthShell>
  );
}
