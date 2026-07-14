"use client";

import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  CreditTransaction,
  DebitTransaction,
  DomesticTransfer,
  WireTransfer,
} from "@/lib/types";
import { EmptyState, ErrorState, Loader, Modal, StatusBadge } from "@/components/ui";
import type { ErrorKind } from "@/lib/api";
import { IconArrowDown, IconArrowUp, IconGlobe, IconTransfer } from "@/components/Icons";

type Tab = "credits" | "debits" | "domestic" | "wire";
type ReceiptType = "credits" | "debits" | "domestic" | "wire";

interface TableState {
  loading: boolean;
  error: string;
  kind: ErrorKind | null;
  reload: () => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "credits", label: "Credits" },
  { key: "debits", label: "Debits" },
  { key: "domestic", label: "Domestic transfers" },
  { key: "wire", label: "Wire transfers" },
];

type ReceiptPreview = { title: string; html: string };

export default function TransactionsPage() {
  const [tab, setTab] = useState<Tab>("credits");
  const [receipt, setReceipt] = useState<ReceiptPreview | null>(null);
  const credits = useApi(() => api.credits(), []);
  const debits = useApi(() => api.debits(), []);
  const domestic = useApi(() => api.domesticTransfers(), []);
  const wire = useApi(() => api.wireTransfers(), []);

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Ledger</span>
        <h1 style={{ marginTop: 8 }}>Transactions</h1>
        <p>Every credit, debit and transfer across your account.</p>
      </div>

      <div className="tabbar" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className="tab"
            data-active={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === "credits" && (
          <SimpleTxTable
            state={credits}
            rows={asList<CreditTransaction>(credits.data)}
            kind="credit"
            onViewReceipt={setReceipt}
          />
        )}
        {tab === "debits" && (
          <SimpleTxTable
            state={debits}
            rows={asList<DebitTransaction>(debits.data)}
            kind="debit"
            onViewReceipt={setReceipt}
          />
        )}
        {tab === "domestic" && (
          <DomesticTable
            state={domestic}
            rows={asList<DomesticTransfer>(domestic.data)}
            onViewReceipt={setReceipt}
          />
        )}
        {tab === "wire" && (
          <WireTable
            state={wire}
            rows={asList<WireTransfer>(wire.data)}
            onViewReceipt={setReceipt}
          />
        )}
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
        .tabbar { display: inline-flex; gap: 4px; padding: 5px; border-radius: 14px; border: 1px solid var(--border); background: rgba(4,8,12,0.5); flex-wrap: wrap; }
        .tab { padding: 9px 16px; border-radius: 10px; font-size: 13.5px; font-weight: 600; color: var(--text-2); cursor: pointer; background: transparent; border: none; transition: all 0.2s var(--ease); }
        .tab:hover { color: var(--text-0); }
        .tab[data-active="true"] { color: var(--neon-bright); background: rgba(61,255,154,0.1); }
        .receipt-frame { width: 100%; height: min(72vh, 760px); border: 1px solid var(--border); border-radius: 14px; background: #fff; }
        .tx-mobile-list { display: none; }
        .tx-actions { display: inline-flex; gap: 8px; justify-content: flex-end; }
        .tx-card { padding: 16px; border-bottom: 1px solid var(--border); }
        .tx-card:last-child { border-bottom: none; }
        .tx-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .tx-title { color: var(--text-0); font-weight: 700; min-width: 0; overflow-wrap: anywhere; }
        .tx-sub { color: var(--text-2); font-size: 13px; margin-top: 2px; }
        .tx-meta { display: grid; gap: 8px; margin: 12px 0; }
        .tx-meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
        .tx-meta-row span:first-child { color: var(--text-2); }
        .tx-meta-row span:last-child { color: var(--text-0); text-align: right; overflow-wrap: anywhere; }
        @media (max-width: 760px) {
          .table-wrap { display: none; }
          .tx-mobile-list { display: block; }
          .tabbar { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
          .tab { min-height: 42px; padding: 8px 10px; white-space: normal; }
          .tx-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
          .tx-actions .btn { width: 100%; }
        }
      `}</style>
    </>
  );
}

async function viewReceipt(
  receiptType: ReceiptType,
  id: number,
  title: string,
  onViewReceipt: (receipt: ReceiptPreview) => void
) {
  try {
    const html = await api.receiptHtml(receiptType, id);
    onViewReceipt({ title, html });
  } catch (err) {
    window.alert(humanizeError(err));
  }
}

async function downloadReceipt(receiptType: ReceiptType, id: number) {
  try {
    const blob = await api.receiptDownload(receiptType, id);
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `vintage-${receiptType}-receipt-${id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch (err) {
    window.alert(humanizeError(err));
  }
}

function ReceiptActions({
  receiptType,
  id,
  title,
  onViewReceipt,
}: {
  receiptType: ReceiptType;
  id: number;
  title: string;
  onViewReceipt: (receipt: ReceiptPreview) => void;
}) {
  return (
    <div className="tx-actions">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => viewReceipt(receiptType, id, title, onViewReceipt)}
      >
        View
      </button>
      <button className="btn btn-ghost btn-sm" onClick={() => downloadReceipt(receiptType, id)}>
        Download
      </button>
    </div>
  );
}

function SimpleTxTable({
  state,
  rows,
  kind,
  onViewReceipt,
}: {
  state: TableState;
  rows: (CreditTransaction | DebitTransaction)[];
  kind: "credit" | "debit";
  onViewReceipt: (receipt: ReceiptPreview) => void;
}) {
  if (state.loading) return <div style={{ padding: 22 }}><Loader /></div>;
  if (state.error) return <ErrorState message={state.error} kind={state.kind} onRetry={state.reload} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={kind === "credit" ? <IconArrowDown /> : <IconArrowUp />}
        title={`No ${kind}s yet`}
        hint={`Your ${kind} transactions will show up here.`}
      />
    );
  }

  const receiptType: ReceiptType = kind === "credit" ? "credits" : "debits";
  const amountClass = kind === "credit" ? "amount-pos" : "amount-neg";
  const amountPrefix = kind === "credit" ? "+" : "-";

  return (
    <>
      <div className="tx-mobile-list">
        {rows.map((r) => {
          const title = r.description || (kind === "credit" ? "Credit" : "Debit");
          return (
            <article className="tx-card" key={r.id}>
              <div className="tx-card-top">
                <div>
                  <div className="tx-title">{title}</div>
                  <div className="tx-sub">{formatDateTime(r.transaction_date)}</div>
                </div>
                <span className={amountClass} style={{ fontWeight: 700 }}>
                  {amountPrefix}{formatCurrency(r.amount)}
                </span>
              </div>
              <div className="tx-meta">
                <div className="tx-meta-row"><span>Status</span><span><StatusBadge status={r.status} /></span></div>
                <div className="tx-meta-row"><span>Reference</span><span className="mono">#{r.id}</span></div>
              </div>
              <ReceiptActions receiptType={receiptType} id={r.id} title={`${title} receipt`} onViewReceipt={onViewReceipt} />
            </article>
          );
        })}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const title = r.description || (kind === "credit" ? "Credit" : "Debit");
              return (
                <tr key={r.id}>
                  <td style={{ color: "var(--text-0)" }}>{title}</td>
                  <td>{formatDateTime(r.transaction_date)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ textAlign: "right" }}>
                    <span className={amountClass} style={{ fontWeight: 600 }}>
                      {amountPrefix}{formatCurrency(r.amount)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <ReceiptActions receiptType={receiptType} id={r.id} title={`${title} receipt`} onViewReceipt={onViewReceipt} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DomesticTable({
  state,
  rows,
  onViewReceipt,
}: {
  state: TableState;
  rows: DomesticTransfer[];
  onViewReceipt: (receipt: ReceiptPreview) => void;
}) {
  if (state.loading) return <div style={{ padding: 22 }}><Loader /></div>;
  if (state.error) return <ErrorState message={state.error} kind={state.kind} onRetry={state.reload} />;
  if (rows.length === 0) {
    return <EmptyState icon={<IconTransfer />} title="No domestic transfers" hint="Send one from the Transfers page." />;
  }

  return (
    <>
      <div className="tx-mobile-list">
        {rows.map((r) => (
          <article className="tx-card" key={r.id}>
            <div className="tx-card-top">
              <div>
                <div className="tx-title">{r.beneficiary_account_name}</div>
                <div className="tx-sub">{formatDateTime(r.created_date_time)}</div>
              </div>
              <span className="amount-neg" style={{ fontWeight: 700 }}>-{formatCurrency(r.amount)}</span>
            </div>
            <div className="tx-meta">
              <div className="tx-meta-row"><span>Bank</span><span>{r.bank_name}</span></div>
              <div className="tx-meta-row"><span>Account</span><span className="mono">{r.beneficiary_account_no}</span></div>
              <div className="tx-meta-row"><span>Type</span><span>{r.account_type}</span></div>
            </div>
            <ReceiptActions receiptType="domestic" id={r.id} title="Domestic transfer receipt" onViewReceipt={onViewReceipt} />
          </article>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Beneficiary</th>
              <th>Bank</th>
              <th>Account</th>
              <th>Type</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ color: "var(--text-0)" }}>{r.beneficiary_account_name}</td>
                <td>{r.bank_name}</td>
                <td className="mono">{r.beneficiary_account_no}</td>
                <td>{r.account_type}</td>
                <td>{formatDateTime(r.created_date_time)}</td>
                <td style={{ textAlign: "right" }}>
                  <span className="amount-neg" style={{ fontWeight: 600 }}>-{formatCurrency(r.amount)}</span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <ReceiptActions receiptType="domestic" id={r.id} title="Domestic transfer receipt" onViewReceipt={onViewReceipt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WireTable({
  state,
  rows,
  onViewReceipt,
}: {
  state: TableState;
  rows: WireTransfer[];
  onViewReceipt: (receipt: ReceiptPreview) => void;
}) {
  if (state.loading) return <div style={{ padding: 22 }}><Loader /></div>;
  if (state.error) return <ErrorState message={state.error} kind={state.kind} onRetry={state.reload} />;
  if (rows.length === 0) {
    return <EmptyState icon={<IconGlobe />} title="No wire transfers" hint="Send an international wire from the Transfers page." />;
  }

  return (
    <>
      <div className="tx-mobile-list">
        {rows.map((r) => (
          <article className="tx-card" key={r.id}>
            <div className="tx-card-top">
              <div>
                <div className="tx-title">{r.beneficiary_account_name}</div>
                <div className="tx-sub">{formatDateTime(r.created_date_time)}</div>
              </div>
              <span className="amount-neg" style={{ fontWeight: 700 }}>-{formatCurrency(r.amount)}</span>
            </div>
            <div className="tx-meta">
              <div className="tx-meta-row"><span>Bank</span><span>{r.bank_name}</span></div>
              <div className="tx-meta-row"><span>Country</span><span>{r.select_country}</span></div>
              <div className="tx-meta-row"><span>SWIFT</span><span className="mono">{r.swift_code}</span></div>
            </div>
            <ReceiptActions receiptType="wire" id={r.id} title="Wire transfer receipt" onViewReceipt={onViewReceipt} />
          </article>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Beneficiary</th>
              <th>Bank</th>
              <th>Country</th>
              <th>SWIFT</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ color: "var(--text-0)" }}>{r.beneficiary_account_name}</td>
                <td>{r.bank_name}</td>
                <td>{r.select_country}</td>
                <td className="mono">{r.swift_code}</td>
                <td>{formatDateTime(r.created_date_time)}</td>
                <td style={{ textAlign: "right" }}>
                  <span className="amount-neg" style={{ fontWeight: 600 }}>-{formatCurrency(r.amount)}</span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <ReceiptActions receiptType="wire" id={r.id} title="Wire transfer receipt" onViewReceipt={onViewReceipt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
