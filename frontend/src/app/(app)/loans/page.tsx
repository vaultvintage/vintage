"use client";

import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Loan } from "@/lib/types";
import { Alert, EmptyState, ErrorState, Field, Loader, Modal } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconLoan, IconPlus } from "@/components/Icons";

const PURPOSES = [
  ["PERSONAL", "Personal"],
  ["MORTGAGE", "Mortgage"],
  ["CAR", "Car"],
  ["EDUCATION", "Education"],
  ["BUSINESS", "Business"],
  ["OTHER", "Other"],
];

export default function LoansPage() {
  const { user } = useAuth();
  const toast = useToast();
  const loans = useApi(() => api.loans(), []);
  const list = asList<Loan>(loans.data);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    borrower_name: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim(),
    loan_amount: "",
    loan_term_years: "1",
    purpose: "PERSONAL",
  });

  const set = (k: keyof typeof form) => (e: any) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.createLoan({
        borrower_name: form.borrower_name,
        loan_amount: form.loan_amount,
        loan_term_years: Number(form.loan_term_years),
        purpose: form.purpose,
      });
      setOpen(false);
      setNotice("Loan application submitted.");
      toast.success("Application submitted", "We'll review your loan shortly.");
      loans.reload();
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Couldn't submit application", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="section-head flex items-center justify-between wrap gap-md">
        <div>
          <span className="eyebrow">Borrow</span>
          <h1 style={{ marginTop: 8 }}>Loans</h1>
          <p>Purpose-based lending. Requires a wallet balance of at least $1,000.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(""); setOpen(true); }}>
          <IconPlus width={16} height={16} /> Apply for loan
        </button>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}

      {loans.loading ? (
        <div className="card"><Loader label="Loading loans…" /></div>
      ) : loans.error ? (
        <div className="card">
          <ErrorState message={loans.error} kind={loans.kind} onRetry={loans.reload} />
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconLoan />}
            title="No loans on file"
            hint="Apply for a loan to see it listed here with its rate and due date."
            action={<button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus width={16} height={16} /> Apply now</button>}
          />
        </div>
      ) : (
        <div className="grid gap-md" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {list.map((loan, i) => (
            <div key={loan.id ?? i} className="card card-hover card-pad">
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <span className="badge badge-success"><span className="badge-dot" />{PURPOSES.find((p) => p[0] === loan.purpose)?.[1] || loan.purpose}</span>
                <span className="text-neon"><IconLoan /></span>
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, color: "var(--text-0)" }}>
                {formatCurrency(loan.loan_amount)}
              </div>
              <div style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 16 }}>{loan.borrower_name}</div>
              <div className="divider" style={{ margin: "0 0 14px" }} />
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <Meta label="Interest" value={`${loan.interest_rate}%`} />
                <Meta label="Term" value={`${loan.loan_term_years} yr`} />
                <Meta label="Issued" value={formatDate(loan.loan_date)} />
                <Meta label="Due" value={formatDate(loan.due_date)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Apply for a loan">
        {error && <Alert>{error}</Alert>}
        <form onSubmit={submit}>
          <Field label="Borrower name">
            <input className="input" value={form.borrower_name} onChange={set("borrower_name")} required />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Amount">
              <input className="input" type="number" step="0.01" min="0" value={form.loan_amount} onChange={set("loan_amount")} placeholder="0.00" required />
            </Field>
            <Field label="Term (years)">
              <input className="input" type="number" min="1" max="30" value={form.loan_term_years} onChange={set("loan_term_years")} required />
            </Field>
          </div>
          <Field label="Purpose">
            <select className="select" value={form.purpose} onChange={set("purpose")}>
              {PURPOSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 16 }}>
            Rates: ≤$5k → 5% · ≤$20k → 3.5% · ≤$50k → 2.5% · above → 1.5%.
          </p>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : "Submit application"}
          </button>
        </form>
      </Modal>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>{label}</div>
      <div style={{ color: "var(--text-1)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
