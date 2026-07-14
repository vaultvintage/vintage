"use client";

import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { PaymentMethod, Wallet, Withdrawal } from "@/lib/types";
import { Alert, EmptyState, ErrorState, Field, Loader, Modal, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconCheck, IconCrypto } from "@/components/Icons";

const CRYPTOS = [
  ["BTC", "Bitcoin"],
  ["ETH", "Ethereum"],
  ["BNB", "Binance Coin"],
  ["USDT", "Tether"],
];

export default function WithdrawalsPage() {
  const toast = useToast();
  const wallet = useApi<Wallet>(() => api.wallet() as Promise<Wallet>, []);
  const withdrawals = useApi(() => api.withdrawals(), []);
  const methods = useApi(() => api.paymentMethods(), []);

  const list = asList<Withdrawal>(withdrawals.data);
  const methodList = asList<PaymentMethod>(methods.data);
  const balance = wallet.data ? parseFloat(wallet.data.balance) : 0;

  const [form, setForm] = useState({ amount: "", crypto_type: "BTC", wallet_address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [receipt, setReceipt] = useState<{ title: string; html: string } | null>(null);

  const set = (k: keyof typeof form) => (e: any) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await api.createWithdrawal({
        amount: form.amount,
        crypto_type: form.crypto_type,
        wallet_address: form.wallet_address,
      });
      setSuccess("Withdrawal request submitted. It's now pending review.");
      toast.success("Withdrawal requested", "Your request is pending review.");
      setForm({ amount: "", crypto_type: "BTC", wallet_address: "" });
      withdrawals.reload();
      wallet.reload();
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Withdrawal failed", msg);
    } finally {
      setBusy(false);
    }
  }

  async function viewReceipt(id: number) {
    try {
      const html = await api.receiptHtml("withdrawals", id);
      setReceipt({ title: "Crypto withdrawal receipt", html });
    } catch (err) {
      toast.error("Receipt unavailable", humanizeError(err));
    }
  }

  async function downloadReceipt(id: number) {
    try {
      const blob = await api.receiptDownload("withdrawals", id);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `vintage-withdrawal-receipt-${id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      toast.error("Download failed", humanizeError(err));
    }
  }

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Cash out</span>
        <h1 style={{ marginTop: 8 }}>Crypto withdrawal</h1>
        <p>Move value out of your wallet into crypto across major networks.</p>
      </div>

      <div className="grid gap-md wd-grid" style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}>
        <div className="card card-pad">
          {error && <Alert>{error}</Alert>}
          {success && <Alert kind="success"><IconCheck width={16} height={16} />{success}</Alert>}

          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Amount" hint={wallet.data ? `Balance ${formatCurrency(balance, wallet.data.currency)}` : undefined}>
                <input className="input" type="number" step="0.00000001" min="0" value={form.amount} onChange={set("amount")} placeholder="0.00" required />
              </Field>
              <Field label="Asset">
                <select className="select" value={form.crypto_type} onChange={set("crypto_type")}>
                  {CRYPTOS.map(([v, l]) => <option key={v} value={v}>{l} ({v})</option>)}
                </select>
              </Field>
            </div>
            <Field label="Destination wallet address">
              <input className="input mono" value={form.wallet_address} onChange={set("wallet_address")} placeholder="Paste recipient address" required />
            </Field>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <span className="spinner" /> : "Request withdrawal"}
            </button>
          </form>

          <div className="divider" />
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Withdrawal history</h3>
          {withdrawals.loading ? (
            <Loader />
          ) : withdrawals.error ? (
            <ErrorState message={withdrawals.error} kind={withdrawals.kind} onRetry={withdrawals.reload} />
          ) : list.length === 0 ? (
            <EmptyState icon={<IconCrypto />} title="No withdrawals yet" hint="Your crypto cash-outs will appear here." />
          ) : (
            <>
              <div className="wd-mobile-list">
                {list.map((w) => (
                  <article className="wd-card" key={w.id}>
                    <div className="wd-card-top">
                      <div>
                        <div className="wd-title">{w.crypto_type}</div>
                        <div className="wd-sub">{formatDateTime(w.transaction_date)}</div>
                      </div>
                      <span className="amount-neg" style={{ fontWeight: 700 }}>-{w.amount}</span>
                    </div>
                    <div className="wd-meta">
                      <div className="wd-meta-row"><span>Status</span><span><StatusBadge status={w.status} /></span></div>
                      <div className="wd-meta-row"><span>Address</span><span className="mono">{w.wallet_address}</span></div>
                    </div>
                    <div className="wd-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => viewReceipt(w.id)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => downloadReceipt(w.id)}>Download</button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Address</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th style={{ textAlign: "right" }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((w) => (
                      <tr key={w.id}>
                        <td style={{ color: "var(--text-0)" }}>{w.crypto_type}</td>
                        <td className="mono" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{w.wallet_address}</td>
                        <td>{formatDateTime(w.transaction_date)}</td>
                        <td><StatusBadge status={w.status} /></td>
                        <td style={{ textAlign: "right" }} className="amount-neg">-{w.amount}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="wd-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => viewReceipt(w.id)}>View</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => downloadReceipt(w.id)}>Download</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="card card-pad">
          <div className="flex items-center gap-sm" style={{ marginBottom: 6 }}>
            <span className="text-neon"><IconCrypto /></span>
            <h3 style={{ fontSize: 17 }}>Supported networks</h3>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 16 }}>
            Deposit addresses configured by the bank.
          </p>
          {methods.loading ? (
            <Loader />
          ) : methodList.length === 0 ? (
            <p style={{ color: "var(--text-3)", fontSize: 13.5 }}>No payment methods configured.</p>
          ) : (
            <div className="grid gap-sm">
              {methodList.map((m) => (
                <div key={m.id} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "rgba(4,8,12,0.4)" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontWeight: 600, color: "var(--text-0)" }}>{m.currency}</span>
                    <span className="badge badge-success"><span className="badge-dot" />{m.network}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8, wordBreak: "break-all" }}>
                    {m.wallet_address}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={receipt?.title ?? "Receipt"}
        width={430}
      >
        {receipt && <iframe title={receipt.title} srcDoc={receipt.html} className="receipt-frame" />}
      </Modal>

      <style>{`
        .receipt-frame { width: 100%; height: min(72vh, 760px); border: 1px solid var(--border); border-radius: 14px; background: #fff; }
        .wd-mobile-list { display: none; }
        .wd-actions { display: inline-flex; gap: 8px; justify-content: flex-end; }
        .wd-card { padding: 16px; border: 1px solid var(--border); border-radius: 14px; background: rgba(4,8,12,0.38); }
        .wd-card + .wd-card { margin-top: 12px; }
        .wd-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .wd-title { color: var(--text-0); font-weight: 700; }
        .wd-sub { color: var(--text-2); font-size: 13px; margin-top: 2px; }
        .wd-meta { display: grid; gap: 8px; margin: 12px 0; }
        .wd-meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
        .wd-meta-row span:first-child { color: var(--text-2); }
        .wd-meta-row span:last-child { color: var(--text-0); text-align: right; overflow-wrap: anywhere; }
        @media (max-width: 860px) { .wd-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 760px) {
          .wd-mobile-list { display: block; }
          .table-wrap { display: none; }
          .wd-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
          .wd-actions .btn { width: 100%; }
        }
      `}</style>
    </>
  );
}
