"use client";

import Link from "next/link";
import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDateTime, maskCard } from "@/lib/format";
import type {
  CreditTransaction,
  DebitTransaction,
  VirtualCard,
  Wallet,
} from "@/lib/types";
import { StatTile, StatusBadge, Loader, EmptyState, ErrorState, Alert } from "@/components/ui";
import { useToast } from "@/components/Toast";
import {
  IconArrowDown,
  IconArrowUp,
  IconCard,
  IconList,
  IconTransfer,
  IconWallet,
  IconCrypto,
} from "@/components/Icons";

interface Row {
  id: string;
  kind: "credit" | "debit";
  amount: string;
  description?: string | null;
  status: string;
  date: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const wallet = useApi<Wallet>(() => api.wallet() as Promise<Wallet>, []);
  const credits = useApi(() => api.credits(), []);
  const debits = useApi(() => api.debits(), []);
  const cards = useApi(() => api.cards(), []);

  const [creating, setCreating] = useState(false);
  const [walletErr, setWalletErr] = useState("");

  const creditList = asList<CreditTransaction>(credits.data);
  const debitList = asList<DebitTransaction>(debits.data);
  const cardList = asList<VirtualCard>(cards.data);

  const totalIn = creditList.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const totalOut = debitList.reduce((s, d) => s + parseFloat(d.amount || "0"), 0);

  const recent: Row[] = [
    ...creditList.map((c) => ({ id: `c${c.id}`, kind: "credit" as const, amount: c.amount, description: c.description, status: c.status, date: c.transaction_date })),
    ...debitList.map((d) => ({ id: `d${d.id}`, kind: "debit" as const, amount: d.amount, description: d.description, status: d.status, date: d.transaction_date })),
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 6);

  const currency = "GBP";
  // A 404 means "no wallet yet" (offer to create); anything else is a real failure.
  const noWallet = !wallet.loading && !wallet.data && wallet.kind === "notfound";
  const walletFailed = !wallet.loading && !wallet.data && !!wallet.kind && wallet.kind !== "notfound";

  async function createWallet() {
    setCreating(true);
    setWalletErr("");
    try {
      await api.createWallet();
      await wallet.reload();
      toast.success("Wallet created", "You're ready to send and receive money.");
    } catch (e) {
      const m = humanizeError(e);
      setWalletErr(m);
      toast.error("Couldn't create wallet", m);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="section-head flex items-center justify-between wrap gap-md">
        <div>
          <span className="eyebrow">Overview</span>
          <h1 style={{ marginTop: 8 }}>
            Good to see you, {user?.first_name || "there"}.
          </h1>
          <p>Here's a snapshot of your money right now.</p>
        </div>
        <Link href="/transfers" className="btn btn-primary">
          <IconTransfer width={16} height={16} />
          New transfer
        </Link>
      </div>

      {/* Balance hero + stats */}
      <div
        className="grid gap-md"
        style={{ gridTemplateColumns: "1.4fr 1fr 1fr", marginBottom: 18 }}
      >
        <div className="card card-pad" style={{ gridColumn: "1 / 2", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(61,255,154,0.04)",
              pointerEvents: "none",
            }}
          />
          <div className="flex items-center justify-between">
            <span className="label" style={{ margin: 0 }}>Available balance</span>
            <span className="text-neon"><IconWallet /></span>
          </div>
          {wallet.loading ? (
            <Loader />
          ) : walletFailed ? (
            <ErrorState message={wallet.error} kind={wallet.kind} onRetry={wallet.reload} />
          ) : noWallet ? (
            <div style={{ marginTop: 10 }}>
              {walletErr && <Alert>{walletErr}</Alert>}
              <p style={{ color: "var(--text-2)", marginBottom: 14 }}>
                You don't have a wallet yet. Create one to start moving money.
              </p>
              <button className="btn btn-primary" onClick={createWallet} disabled={creating}>
                {creating ? <span className="spinner" /> : "Create my wallet"}
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 44,
                  color: "var(--text-0)",
                  margin: "12px 0 6px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCurrency(wallet.data!.balance, currency)}
              </div>
              <div className="flex items-center gap-md wrap" style={{ color: "var(--text-2)", fontSize: 13.5 }}>
                <span className="mono">Acct · {wallet.data!.account_number}</span>
                <span className="badge badge-success"><span className="badge-dot" />{currency}</span>
              </div>
              <Link
                href="/deposit"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 16 }}
              >
                <IconArrowDown width={15} height={15} /> Add funds
              </Link>
            </>
          )}
        </div>

        <StatTile
          label="Money in"
          value={formatCurrency(totalIn, currency)}
          icon={<IconArrowDown />}
          accent
          sub={`${creditList.length} credit${creditList.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Money out"
          value={formatCurrency(totalOut, currency)}
          icon={<IconArrowUp />}
          sub={`${debitList.length} debit${debitList.length === 1 ? "" : "s"}`}
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-md quick-grid" style={{ marginBottom: 22 }}>
        <QuickAction href="/deposit" icon={<IconArrowDown />} label="Add funds" hint="Deposit to wallet" />
        <QuickAction href="/transfers" icon={<IconTransfer />} label="Send money" hint="Domestic & wire" />
        <QuickAction href="/cards" icon={<IconCard />} label="Virtual cards" hint={`${cardList.length} active`} />
        <QuickAction href="/withdrawals" icon={<IconCrypto />} label="Crypto cash-out" hint="BTC · ETH · USDT" />
      </div>

      {/* Recent activity + card preview */}
      <div className="grid gap-md" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        <div className="card">
          <div className="flex items-center justify-between" style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 18 }}>Recent activity</h3>
            <Link href="/transactions" className="text-neon" style={{ fontSize: 13, fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          {credits.loading || debits.loading ? (
            <div style={{ padding: 22 }}><Loader /></div>
          ) : recent.length === 0 ? (
            <EmptyState icon={<IconList />} title="No transactions yet" hint="Your credits and debits will appear here." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-sm">
                          <span
                            style={{
                              display: "inline-flex",
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              alignItems: "center",
                              justifyContent: "center",
                              background: r.kind === "credit" ? "rgba(61,255,154,0.1)" : "rgba(255,92,106,0.1)",
                              color: r.kind === "credit" ? "var(--neon)" : "var(--danger)",
                            }}
                          >
                            {r.kind === "credit" ? <IconArrowDown width={16} height={16} /> : <IconArrowUp width={16} height={16} />}
                          </span>
                          <div>
                            <div style={{ color: "var(--text-0)", fontWeight: 500 }}>
                              {r.description || (r.kind === "credit" ? "Credit" : "Debit")}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{formatDateTime(r.date)}</div>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <span className={r.kind === "credit" ? "amount-pos" : "amount-neg"} style={{ fontWeight: 600 }}>
                          {r.kind === "credit" ? "+" : "−"}
                          {formatCurrency(r.amount, currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Featured virtual card */}
        <div>
          <MiniCard card={cardList[0]} loading={cards.loading} />
          <Link href="/cards" className="btn btn-ghost btn-block" style={{ marginTop: 14 }}>
            <IconCard width={16} height={16} />
            Manage cards
          </Link>
        </div>
      </div>

      <style>{`
        .quick-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 900px) {
          .section-head, .grid { }
        }
        @media (max-width: 860px) {
          .quick-grid { grid-template-columns: repeat(2, 1fr); }
          .app-content .grid[style*="1.4fr"] { grid-template-columns: 1fr !important; }
          .app-content .grid[style*="1.6fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function QuickAction({ href, icon, label, hint }: { href: string; icon: React.ReactNode; label: string; hint: string }) {
  return (
    <Link href={href} className="card card-hover card-pad" style={{ display: "block" }}>
      <span style={{ display: "inline-flex", padding: 10, borderRadius: 11, background: "rgba(61,255,154,0.07)", border: "1px solid var(--border)", color: "var(--neon)", marginBottom: 14 }}>
        {icon}
      </span>
      <div style={{ color: "var(--text-0)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{hint}</div>
    </Link>
  );
}

function MiniCard({ card, loading }: { card?: VirtualCard; loading: boolean }) {
  return (
    <div
      className="card"
      style={{
        padding: 22,
        minHeight: 190,
        background: "var(--sunken)",
        position: "relative",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">{card?.card_provider || "Virtual"} Card</span>
        <span className="text-neon"><IconCard width={22} height={22} /></span>
      </div>
      {loading ? (
        <Loader />
      ) : !card ? (
        <div style={{ marginTop: 30, color: "var(--text-2)", fontSize: 14 }}>
          No card yet — create one to see it here.
        </div>
      ) : (
        <>
          <div className="mono" style={{ fontSize: 18, letterSpacing: "0.12em", color: "var(--text-0)", margin: "32px 0 18px" }}>
            {maskCard(`••••••••••••${card.card_number.slice(-4)}`)}
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 12.5, color: "var(--text-2)" }}>
            <span>{card.user_full_name || "Cardholder"}</span>
            <span className="mono">EXP {card.expiry_date?.slice(0, 7)}</span>
          </div>
        </>
      )}
    </div>
  );
}
