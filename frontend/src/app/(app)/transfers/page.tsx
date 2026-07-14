"use client";

import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { formatCurrency } from "@/lib/format";
import type { Wallet } from "@/lib/types";
import { Alert, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconCheck, IconGlobe, IconShield, IconTransfer } from "@/components/Icons";

type Mode = "domestic" | "wire";

const DOMESTIC_TYPES = ["Savings", "Current", "Business"];
const WIRE_TYPES = [
  ["SAVINGS", "Savings Account"],
  ["CURRENT", "Current Account"],
  ["CHECKING", "Checking Account"],
  ["FIXED", "Fixed Deposit"],
  ["NON_RESIDENT", "Non Resident Account"],
  ["ONLINE", "Online Banking"],
  ["DOMICILIARY", "Domiciliary Account"],
  ["JOINT", "Joint Account"],
];

export default function TransfersPage() {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("domestic");
  const wallet = useApi<Wallet>(() => api.wallet() as Promise<Wallet>, []);

  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [common, setCommon] = useState({
    amount: "",
    beneficiary_account_name: "",
    beneficiary_account_no: "",
    bank_name: "",
    otp: "",
  });
  const [domestic, setDomestic] = useState({ account_type: "Savings", narration: "" });
  const [wire, setWire] = useState({
    select_country: "",
    swift_code: "",
    routing_number: "",
    account_type: "SAVINGS",
    narration_purpose: "",
  });

  const balance = wallet.data ? parseFloat(wallet.data.balance) : 0;

  function reset() {
    setCommon({ amount: "", beneficiary_account_name: "", beneficiary_account_no: "", bank_name: "", otp: "" });
    setDomestic({ account_type: "Savings", narration: "" });
    setWire({ select_country: "", swift_code: "", routing_number: "", account_type: "SAVINGS", narration_purpose: "" });
    setOtpSent(false);
  }

  async function requestOtp() {
    setError("");
    setSuccess("");
    setOtpLoading(true);
    try {
      await api.initiateOtp();
      setOtpSent(true);
      setSuccess("A one-time code has been sent to your email.");
      toast.success("Code sent", "Check your email for the one-time code.");
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Couldn't send code", msg);
    } finally {
      setOtpLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!common.otp) {
      setError("Enter the OTP sent to your email.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "domestic") {
        await api.createDomesticTransfer({ ...common, ...domestic });
      } else {
        await api.createWireTransfer({ ...common, ...wire });
      }
      const label = mode === "domestic" ? "Domestic" : "Wire";
      setSuccess(`${label} transfer submitted successfully.`);
      toast.success("Transfer sent", `Your ${label.toLowerCase()} transfer was submitted.`);
      reset();
      wallet.reload();
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Transfer failed", msg);
    } finally {
      setSubmitting(false);
    }
  }

  const setC = (k: keyof typeof common) => (e: any) => setCommon((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Move money</span>
        <h1 style={{ marginTop: 8 }}>Transfers</h1>
        <p>Send funds domestically or by international wire — each secured with a one-time code.</p>
      </div>

      <div className="grid gap-md transfer-grid" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        <div className="card card-pad">
          {/* Mode switch */}
          <div className="mode-switch" style={{ marginBottom: 22 }}>
            <button className="mode" data-active={mode === "domestic"} onClick={() => { setMode("domestic"); setError(""); setSuccess(""); }}>
              <IconTransfer width={17} height={17} /> Domestic
            </button>
            <button className="mode" data-active={mode === "wire"} onClick={() => { setMode("wire"); setError(""); setSuccess(""); }}>
              <IconGlobe width={17} height={17} /> Wire
            </button>
          </div>

          {error && <Alert>{error}</Alert>}
          {success && <Alert kind="success"><IconCheck width={16} height={16} />{success}</Alert>}

          <form onSubmit={submit}>
            <Field label="Amount" hint={wallet.data ? `Available: ${formatCurrency(balance, wallet.data.currency)}` : undefined}>
              <input className="input" type="number" step="0.01" min="0" value={common.amount} onChange={setC("amount")} placeholder="0.00" required />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Beneficiary name">
                <input className="input" value={common.beneficiary_account_name} onChange={setC("beneficiary_account_name")} required />
              </Field>
              <Field label="Account number">
                <input className="input" value={common.beneficiary_account_no} onChange={setC("beneficiary_account_no")} required />
              </Field>
            </div>

            <Field label="Bank name">
              <input className="input" value={common.bank_name} onChange={setC("bank_name")} required />
            </Field>

            {mode === "domestic" ? (
              <>
                <Field label="Account type">
                  <select className="select" value={domestic.account_type} onChange={(e) => setDomestic((s) => ({ ...s, account_type: e.target.value }))}>
                    {DOMESTIC_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Narration">
                  <textarea className="textarea" value={domestic.narration} onChange={(e) => setDomestic((s) => ({ ...s, narration: e.target.value }))} placeholder="What's this for?" required />
                </Field>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Country">
                    <input className="input" value={wire.select_country} onChange={(e) => setWire((s) => ({ ...s, select_country: e.target.value }))} required />
                  </Field>
                  <Field label="Account type">
                    <select className="select" value={wire.account_type} onChange={(e) => setWire((s) => ({ ...s, account_type: e.target.value }))}>
                      {WIRE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="SWIFT / BIC">
                    <input className="input" value={wire.swift_code} onChange={(e) => setWire((s) => ({ ...s, swift_code: e.target.value }))} required />
                  </Field>
                  <Field label="Routing number" hint="Optional">
                    <input className="input" value={wire.routing_number} onChange={(e) => setWire((s) => ({ ...s, routing_number: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Purpose">
                  <textarea className="textarea" value={wire.narration_purpose} onChange={(e) => setWire((s) => ({ ...s, narration_purpose: e.target.value }))} placeholder="Purpose of transfer" />
                </Field>
              </>
            )}

            <div className="divider" />

            {/* OTP */}
            <Field label="One-time code">
              <div className="flex gap-sm">
                <input className="input mono" value={common.otp} onChange={setC("otp")} placeholder="6-digit code" maxLength={6} style={{ letterSpacing: "0.3em" }} />
                <button type="button" className="btn btn-ghost" onClick={requestOtp} disabled={otpLoading} style={{ whiteSpace: "nowrap" }}>
                  {otpLoading ? <span className="spinner" /> : otpSent ? "Resend" : "Send code"}
                </button>
              </div>
            </Field>

            <button className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? <span className="spinner" /> : `Send ${mode === "domestic" ? "domestic" : "wire"} transfer`}
            </button>
          </form>
        </div>

        {/* Side info */}
        <div className="grid gap-md">
          <div className="card card-pad">
            <span className="text-neon"><IconShield /></span>
            <h3 style={{ fontSize: 17, margin: "12px 0 8px" }}>Two-factor by design</h3>
            <p style={{ color: "var(--text-2)", fontSize: 14 }}>
              Every transfer needs a fresh one-time code sent to your email. Codes expire after 10 minutes.
            </p>
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 17, marginBottom: 12 }}>How it works</h3>
            <ol style={{ paddingLeft: 18, color: "var(--text-2)", fontSize: 14, display: "grid", gap: 10 }}>
              <li>Fill in the beneficiary and amount.</li>
              <li>Tap <span className="text-neon">Send code</span> to receive your OTP.</li>
              <li>Enter the code and confirm — funds leave instantly.</li>
            </ol>
          </div>
        </div>
      </div>

      <style>{`
        .mode-switch { display: inline-flex; gap: 4px; padding: 5px; border-radius: 14px; border: 1px solid var(--border); background: rgba(4,8,12,0.5); }
        .mode { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--text-2); cursor: pointer; background: transparent; border: none; transition: all 0.2s var(--ease); }
        .mode:hover { color: var(--text-0); }
        .mode[data-active="true"] { color: var(--neon-bright); background: rgba(61,255,154,0.1); }
        @media (max-width: 860px) { .transfer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
