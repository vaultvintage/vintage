"use client";

import { useState } from "react";
import { api, humanizeError } from "@/lib/api";
import { useApi, asList } from "@/lib/useApi";
import { formatDate } from "@/lib/format";
import type { VirtualCard } from "@/lib/types";
import { Alert, EmptyState, ErrorState, Field, Loader, Modal } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconCard, IconPlus, IconEye, IconEyeOff } from "@/components/Icons";

const PROVIDERS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "JCB"];

export default function CardsPage() {
  const toast = useToast();
  const cards = useApi(() => api.cards(), []);
  const list = asList<VirtualCard>(cards.data);

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("VISA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.createCard(provider);
      setOpen(false);
      setNotice("Virtual card created — $5.00 was deducted from your wallet.");
      toast.success("Card created", `Your new ${provider} card is ready.`);
      cards.reload();
    } catch (err) {
      const msg = humanizeError(err);
      setError(msg);
      toast.error("Couldn't create card", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="section-head flex items-center justify-between wrap gap-md">
        <div>
          <span className="eyebrow">Spend</span>
          <h1 style={{ marginTop: 8 }}>Virtual cards</h1>
          <p>Issue a card in seconds. A $5.00 fee applies at creation.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(""); setOpen(true); }}>
          <IconPlus width={16} height={16} /> New card
        </button>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}

      {cards.loading ? (
        <div className="card"><Loader label="Loading your cards…" /></div>
      ) : cards.error ? (
        <div className="card">
          <ErrorState message={cards.error} kind={cards.kind} onRetry={cards.reload} />
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCard />}
            title="No cards yet"
            hint="Create your first virtual card to shop online securely."
            action={<button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus width={16} height={16} /> Create card</button>}
          />
        </div>
      ) : (
        <div className="grid gap-md" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {list.map((card, i) => (
            <CardFace key={card.card_number + i} card={card} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a virtual card">
        {error && <Alert>{error}</Alert>}
        <form onSubmit={create}>
          <Field label="Card network" hint="A $5.00 issuance fee is charged to your wallet.">
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <span className="spinner" /> : "Create card"}
          </button>
        </form>
      </Modal>
    </>
  );
}

type NetworkStyle = { background: string; logo: React.ReactNode };

function NetworkLogo({ provider }: { provider: string }) {
  switch (provider) {
    case "MASTERCARD":
      return (
        <span className="mc-marks" aria-label="Mastercard">
          <span /><span />
        </span>
      );
    case "AMEX":
      return (
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "0.02em", fontStyle: "italic" }}>
          AMEX
        </span>
      );
    case "DISCOVER":
      return (
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "0.02em" }}>
          DISC<span style={{ color: "#f68121" }}>O</span>VER
        </span>
      );
    case "JCB":
      return (
        <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
          <b style={{ background: "#0b4ea2", padding: "2px 4px", borderRadius: 3, fontSize: 11 }}>J</b>
          <b style={{ background: "#be1e2d", padding: "2px 4px", borderRadius: 3, fontSize: 11 }}>C</b>
          <b style={{ background: "#1d8a4c", padding: "2px 4px", borderRadius: 3, fontSize: 11 }}>B</b>
        </span>
      );
    default: // VISA
      return (
        <span style={{ fontWeight: 800, fontStyle: "italic", fontSize: 21, letterSpacing: "0.04em", color: "#f7b600" }}>
          VISA
        </span>
      );
  }
}

const NETWORK_STYLES: Record<string, string> = {
  VISA: "linear-gradient(135deg, #1a3a8f 0%, #1e4fb8 45%, #0d2456 100%)",
  MASTERCARD: "linear-gradient(135deg, #2b2b31 0%, #4a3f3a 55%, #1a1a1f 100%)",
  AMEX: "linear-gradient(135deg, #0a7d6e 0%, #12a58f 50%, #05564b 100%)",
  DISCOVER: "linear-gradient(135deg, #3a3128 0%, #6b4e2e 55%, #221c15 100%)",
  JCB: "linear-gradient(135deg, #241f47 0%, #3b2f7a 50%, #14102b 100%)",
};

/* subtle contactless glyph */
function Contactless() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" style={{ opacity: 0.85 }}>
      <path d="M2 4a11 11 0 0 1 0 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 6a7 7 0 0 1 0 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 8a3.5 3.5 0 0 1 0 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CardFace({ card }: { card: VirtualCard }) {
  const [reveal, setReveal] = useState(false);
  const provider = (card.card_provider || "VISA").toUpperCase();
  const digits = card.card_number || "";
  const shown = reveal
    ? digits.replace(/(.{4})/g, "$1 ").trim()
    : `•••• •••• •••• ${digits.slice(-4)}`;
  const background = NETWORK_STYLES[provider] || NETWORK_STYLES.VISA;

  return (
    <div className="vcard" style={{ background }}>
      <button
        className="vcard-reveal"
        onClick={() => setReveal((v) => !v)}
        aria-label={reveal ? "Hide card details" : "Reveal card details"}
        title={reveal ? "Hide details" : "Reveal details"}
      >
        {reveal ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
      </button>

      {/* top row: chip + contactless */}
      <div className="flex items-center gap-md">
        <div className="vcard-chip" aria-hidden />
        <Contactless />
        <span style={{ marginLeft: "auto", fontSize: 11, letterSpacing: "0.16em", opacity: 0.7, textTransform: "uppercase" }}>
          Vintage Bank
        </span>
      </div>

      {/* card number */}
      <div className="vcard-num">{shown}</div>

      {/* bottom: holder / expiry / cvv + network */}
      <div className="flex items-end justify-between gap-md">
        <div style={{ minWidth: 0 }}>
          <div className="vcard-label">Card Holder</div>
          <div className="vcard-val" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase" }}>
            {card.user_full_name || "—"}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="vcard-label">Valid Thru</div>
          <div className="vcard-val mono">{formatDate(card.expiry_date)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="vcard-label">CVV</div>
          <div className="vcard-val mono">{reveal ? card.cvv : "•••"}</div>
        </div>
        <div style={{ flexShrink: 0, alignSelf: "flex-end" }}>
          <NetworkLogo provider={provider} />
        </div>
      </div>
    </div>
  );
}
