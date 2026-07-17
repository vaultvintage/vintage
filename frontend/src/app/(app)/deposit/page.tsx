"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  loadPayments,
  savePayment,
  getPayment,
  getActive,
  setActive,
  prunePayments,
  type StoredPayment,
} from "@/lib/depositStore";
import type { CreditTransaction, PaymentMethod, Wallet } from "@/lib/types";
import {
  Alert,
  EmptyState,
  ErrorState,
  Field,
  Loader,
  StatusBadge,
} from "@/components/ui";
import { useToast } from "@/components/Toast";
import { PaymentModal, type PaymentDetails } from "@/components/PaymentModal";
import { IconArrowDown, IconCheck, IconCrypto, IconShield, IconWallet } from "@/components/Icons";

const QUICK = [50, 100, 250, 500, 1000];

const NETWORK_NAME: Record<string, string> = {
  TRC: "Tron (TRC-20)",
  ETH: "Ethereum (ERC-20)",
  BSC: "BNB Smart Chain (BEP-20)",
  BTC: "Bitcoin",
};

// Used only if the bank hasn't configured any deposit addresses yet.
const FALLBACK_ASSETS: AssetOption[] = [
  { currency: "USDT", network: "Tron (TRC-20)", address: "TRHpHKbAUQW7KyaA7DEFmCAGBoh3NebC8Z" },
  { currency: "BTC", network: "Bitcoin", address: "bc1qw3vintagebankdemodepositaddr0xa9k2" },
  { currency: "ETH", network: "Ethereum (ERC-20)", address: "0x9F4Vintg8BankDemoDeposit3A2b71C0dE5f" },
];

interface AssetOption {
  currency: string;
  network: string;
  address: string;
}

function randomId() {
  return Math.random().toString(36).slice(2, 6);
}

// Rate window: random duration between 12 and 35 minutes.
function randomTimerSeconds() {
  return Math.floor((12 + Math.random() * 23) * 60);
}

// A small spread over 1:1 so the USDT quote reads like a live rate.
function quoteUsdt(usd: number) {
  const spread = 1 + (0.0006 + Math.random() * 0.0008);
  return (usd * spread).toFixed(5);
}

export default function DepositPage() {
  const { user } = useAuth();
  const toast = useToast();

  const wallet = useApi<Wallet>(() => api.wallet() as Promise<Wallet>, []);
  const credits = useApi(() => api.credits(), []);
  const methods = useApi(() => api.paymentMethods(), []);

  const history = asList<CreditTransaction>(credits.data)
    .slice()
    .sort((a, b) => +new Date(b.transaction_date) - +new Date(a.transaction_date));
  const currency = "GBP";

  const assets: AssetOption[] = useMemo(() => {
    const list = asList<PaymentMethod>(methods.data).map((m) => ({
      currency: m.currency,
      network: NETWORK_NAME[m.network] || m.network,
      address: m.wallet_address,
    }));
    return list.length ? list : FALLBACK_ASSETS;
  }, [methods.data]);

  const [form, setForm] = useState({ amount: "", assetIdx: 0, description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<PaymentDetails | null>(null);

  const set = (k: keyof typeof form) => (e: any) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  // Prune stored invoices for deposits that are no longer PENDING, and reopen
  // the active (unpaid, unreported) payment after a refresh.
  useEffect(() => {
    if (credits.loading) return;
    const list = asList<CreditTransaction>(credits.data);
    const pendingIds = new Set(
      list.filter((c) => c.status === "PENDING").map((c) => c.id)
    );
    prunePayments(pendingIds);

    const activeId = getActive();
    if (activeId != null && pendingIds.has(activeId)) {
      const stored = getPayment(activeId);
      if (stored && !stored.reported) {
        setPayment((p) => p ?? stored);
        return;
      }
    }
    if (activeId != null && !pendingIds.has(activeId)) setActive(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits.loading, credits.data]);

  /** Reconstruct a payment invoice for a pending deposit not in local storage. */
  function reconstruct(credit: CreditTransaction): StoredPayment {
    const asset =
      assets.find((a) => credit.description?.includes(a.currency)) ?? assets[0];
    const usd = parseFloat(credit.amount);
    return {
      creditId: credit.id,
      usd,
      usdt: quoteUsdt(usd),
      asset: asset.currency,
      network: asset.network,
      address: asset.address,
      currency,
      paymentId: `VBK-${String(credit.id).padStart(6, "0")}-${randomId()}`,
      startedAt: Date.now(),
      timerSeconds: randomTimerSeconds(),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!user) {
      setError("Your session isn't ready yet. Please try again.");
      return;
    }
    const asset = assets[Number(form.assetIdx)] ?? assets[0];

    setBusy(true);
    try {
      const created = (await api.createDeposit({
        user: user.id,
        amount: form.amount,
        description:
          form.description || `Crypto deposit · ${asset.currency} on ${asset.network}`,
      })) as CreditTransaction;

      const invoice: StoredPayment = {
        creditId: created.id,
        usd: amt,
        usdt: quoteUsdt(amt),
        asset: asset.currency,
        network: asset.network,
        address: asset.address,
        currency,
        paymentId: `VBK-${String(created?.id ?? "").padStart(6, "0")}-${randomId()}`,
        startedAt: Date.now(),
        timerSeconds: randomTimerSeconds(),
      };
      savePayment(invoice);
      setActive(invoice.creditId);
      setPayment(invoice);
      credits.reload();
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Couldn't start deposit", msg);
    } finally {
      setBusy(false);
    }
  }

  /** Open (or reopen) the payment page for a pending deposit row. */
  function openFor(credit: CreditTransaction) {
    // Always land on the pay view (not the "reported" confirmation).
    const invoice = { ...(getPayment(credit.id) ?? reconstruct(credit)), reported: false };
    savePayment(invoice);
    setActive(credit.id);
    setPayment(invoice);
  }

  // Closing (X / "Pay later") keeps the invoice active so it reopens on refresh.
  function closePayment() {
    setPayment(null);
  }

  // User reported the transfer → stop auto-reopening on refresh.
  function reportedPayment() {
    if (payment) savePayment({ ...payment, reported: true });
    setActive(null);
    credits.reload();
  }

  function finishPayment() {
    setPayment(null);
    setForm({ amount: "", assetIdx: form.assetIdx, description: "" });
    toast.success("Deposit pending", "We'll credit your wallet once it's confirmed.");
    credits.reload();
    wallet.reload();
  }

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Add money</span>
        <h1 style={{ marginTop: 8 }}>Deposit</h1>
        <p>Fund your wallet with crypto. Deposits are credited once confirmed by our team.</p>
      </div>

      {/* Balance banner */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="flex items-center justify-between wrap gap-md">
          <div>
            <span className="label" style={{ margin: 0 }}>Current balance</span>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 34,
                color: "var(--text-0)",
                marginTop: 6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {wallet.loading ? "—" : formatCurrency(wallet.data?.balance ?? 0, currency)}
            </div>
          </div>
          <span
            style={{
              display: "inline-flex",
              padding: 14,
              borderRadius: 14,
              background: "rgba(61,255,154,0.08)",
              border: "1px solid var(--border)",
              color: "var(--neon)",
            }}
          >
            <IconWallet width={26} height={26} />
          </span>
        </div>
      </div>

      <div
        className="grid gap-md dep-grid"
        style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}
      >
        {/* Deposit form + history */}
        <div className="card card-pad">
          {error && <Alert>{error}</Alert>}

          <form onSubmit={submit}>
            <Field label="Amount">
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={set("amount")}
                placeholder="0.00"
                required
              />
            </Field>

            <div className="flex gap-sm wrap" style={{ marginBottom: 18 }}>
              {QUICK.map((q) => (
                <button
                  type="button"
                  key={q}
                  className="btn btn-ghost btn-sm"
                  onClick={() => setForm((s) => ({ ...s, amount: String(q) }))}
                >
                  {formatCurrency(q, currency)}
                </button>
              ))}
            </div>

            <Field label="Pay with" hint="Choose the asset and network you'll send.">
              <select className="select" value={form.assetIdx} onChange={set("assetIdx")}>
                {assets.map((a, i) => (
                  <option key={`${a.currency}-${i}`} value={i}>
                    {a.currency} · {a.network}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Note" hint="Optional — a reference for your records.">
              <input
                className="input"
                value={form.description}
                onChange={set("description")}
                placeholder="e.g. Savings top-up"
              />
            </Field>

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <span className="spinner" /> : "Add funds"}
            </button>
          </form>

          <div className="divider" />
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Deposit history</h3>
          {credits.loading ? (
            <Loader />
          ) : credits.error ? (
            <ErrorState message={credits.error} kind={credits.kind} onRetry={credits.reload} />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<IconArrowDown />}
              title="No deposits yet"
              hint="Your wallet top-ups will appear here."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => {
                    const pending = c.status === "PENDING";
                    return (
                      <tr
                        key={c.id}
                        onClick={pending ? () => openFor(c) : undefined}
                        style={pending ? { cursor: "pointer" } : undefined}
                        title={pending ? "Open payment page" : undefined}
                      >
                        <td style={{ color: "var(--text-0)" }}>
                          {c.description || "Deposit"}
                          {pending && (
                            <span className="text-neon" style={{ fontSize: 12, marginLeft: 8 }}>
                              · Pay now →
                            </span>
                          )}
                        </td>
                        <td>{formatDateTime(c.transaction_date)}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            className={c.status === "COMPLETED" ? "amount-pos" : ""}
                            style={{ fontWeight: 600, color: c.status === "COMPLETED" ? undefined : "var(--text-2)" }}
                          >
                            +{formatCurrency(c.amount, currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card card-pad">
          <div className="flex items-center gap-sm" style={{ marginBottom: 14 }}>
            <span className="text-neon"><IconCrypto /></span>
            <h3 style={{ fontSize: 17 }}>How deposits work</h3>
          </div>
          <ol style={{ listStyle: "none", display: "grid", gap: 16, margin: 0, padding: 0 }}>
            {[
              ["Enter an amount & asset", "Pick how much to add and which coin you'll send."],
              ["Send to the address", "Scan the QR or copy the deposit address and pay from your wallet."],
              ["We confirm & credit", "Once the payment is verified, your Vintage Bank wallet is credited."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-md">
                <span
                  style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(61,255,154,0.1)", border: "1px solid var(--border-strong)",
                    color: "var(--neon)", fontWeight: 700, fontSize: 13,
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <div style={{ color: "var(--text-0)", fontWeight: 600, fontSize: 14.5 }}>{t}</div>
                  <div style={{ color: "var(--text-2)", fontSize: 13 }}>{d}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="divider" />
          <div className="flex items-center gap-sm" style={{ color: "var(--text-2)", fontSize: 13 }}>
            <span className="text-neon"><IconShield width={16} height={16} /></span>
            Deposits stay <StatusBadge status="PENDING" /> until approved.
          </div>
          <Link href="/withdrawals" className="text-neon" style={{ fontSize: 13, fontWeight: 600, display: "inline-block", marginTop: 14 }}>
            Need to cash out instead? →
          </Link>
        </div>
      </div>

      {payment && (
        <PaymentModal
          details={payment}
          onClose={closePayment}
          onReported={reportedPayment}
          onDone={finishPayment}
        />
      )}

      <style>{`@media (max-width: 860px){ .dep-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
