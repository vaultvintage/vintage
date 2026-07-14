"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "./Toast";
import type { StoredPayment } from "@/lib/depositStore";
import { IconCheck, IconClose, IconShield } from "./Icons";

export type PaymentDetails = StoredPayment;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function remainingFrom(details: PaymentDetails) {
  const elapsed = Math.floor((Date.now() - details.startedAt) / 1000);
  return Math.max(0, details.timerSeconds - elapsed);
}

export function PaymentModal({
  details,
  onClose,
  onReported,
  onDone,
}: {
  details: PaymentDetails;
  onClose: () => void;
  onReported: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [submitted, setSubmitted] = useState(!!details.reported);

  const usdt = details.usdt;
  const totalSeconds = details.timerSeconds;
  const [remaining, setRemaining] = useState(() => remainingFrom(details));

  useEffect(() => {
    setRemaining(remainingFrom(details));
    const id = setInterval(() => setRemaining(remainingFrom(details)), 1000);
    return () => clearInterval(id);
  }, [details]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const expired = remaining === 0;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const pct = (remaining / totalSeconds) * 100;

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied", `${what} copied to clipboard.`);
    } catch {
      toast.error("Couldn't copy", "Please copy it manually.");
    }
  }

  const step = submitted ? 2 : 1; // 1 waiting, 2 processing, 3 completed

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-shell" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="pay-header">
          <span className="flex items-center gap-sm" style={{ color: "var(--text-2)", fontSize: 13 }}>
            <IconShield width={15} height={15} className="text-neon" /> Secure crypto checkout
          </span>
          <button className="pay-x" onClick={onClose} aria-label="Close">
            <IconClose width={16} height={16} />
          </button>
        </div>

        <div className="pay-progress-bar" />

        <div className="pay-grid">
          {/* LEFT — summary + stepper */}
          <aside className="pay-left">
            <div className="pay-eyebrow">Amount to pay</div>
            <div className="pay-amount">
              {details.usd.toLocaleString(undefined, { minimumFractionDigits: 0 })}{" "}
              <span>{details.currency}</span>
            </div>
            <div className="pay-usdt">≈ {usdt} {details.asset}</div>

            <div className="pay-sep" />

            <ol className="pay-steps">
              <PayStep n={1} active={step === 1} done={step > 1} title="Waiting for payment" sub="Send the exact amount" />
              <PayStep n={2} active={step === 2} done={step > 2} title="Processing payment" sub="Confirming on-chain" />
              <PayStep n={3} active={false} done={false} title="Completed" sub="Wallet credited" />
            </ol>

            <div className="pay-id">
              <div>
                <div className="pay-id-label">Payment ID</div>
                <div className="mono pay-id-val">{details.paymentId}</div>
              </div>
              <button className="pay-copy" onClick={() => copy(details.paymentId, "Payment ID")}>
                Copy
              </button>
            </div>

            <div className="pay-note">
              <IconShield width={14} height={14} /> Non-custodial — funds settle to Vintage Bank, then
              credit your wallet on confirmation.
            </div>
          </aside>

          {/* RIGHT — pay panel */}
          <div className="pay-right">
            {submitted ? (
              <div className="pay-submitted">
                <span className="pay-submitted-ic"><IconCheck width={26} height={26} /></span>
                <h3>Payment reported</h3>
                <p>
                  Thanks! Your deposit of <strong>{usdt} {details.asset}</strong> is now{" "}
                  <span className="text-neon">pending confirmation</span>. We'll credit your Vintage Bank
                  wallet as soon as an administrator approves it.
                </p>
                <button className="btn btn-primary btn-block" onClick={onDone}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="pay-rate">
                  <span>{expired ? "Rate expired — refresh to continue" : "Rate has been refreshed"}</span>
                  <span className={`pay-timer${expired ? " expired" : ""}`}>
                    ⏱ {pad(mm)}:{pad(ss)}
                  </span>
                </div>
                <div className="pay-timer-track">
                  <div className="pay-timer-fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="pay-send">
                  <div className="flex items-center justify-between">
                    <span className="pay-eyebrow" style={{ margin: 0 }}>Send exactly</span>
                    <button className="pay-copy" onClick={() => copy(usdt, "Amount")}>Copy</button>
                  </div>
                  <div className="pay-send-amt">
                    {usdt} <span>{details.asset}</span>
                  </div>
                  <div className="pay-send-sub">≈ {details.usd} {details.currency} · exact amount required to match</div>
                </div>

                <div className="pay-qr-wrap">
                  <div className="pay-qr">
                    <QRCodeSVG
                      value={details.address}
                      size={188}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#0a1220"
                    />
                    <span className="pay-qr-badge">{details.asset}</span>
                  </div>
                  <div className="pay-qr-caption">
                    <span className="badge-dot" style={{ background: "var(--neon)", boxShadow: "0 0 8px var(--neon)" }} />
                    Scan with your wallet to pay
                  </div>
                </div>

                <div className="pay-addr">
                  <div className="flex items-center justify-between">
                    <span className="pay-eyebrow" style={{ margin: 0 }}>Deposit address</span>
                    <button className="pay-copy" onClick={() => copy(details.address, "Address")}>Copy</button>
                  </div>
                  <div className="mono pay-addr-val">{details.address}</div>
                  <div className="pay-network">
                    <IconShield width={15} height={15} className="text-neon" />
                    Send <strong>{details.asset}</strong> on the <strong>{details.network}</strong> network only
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    setSubmitted(true);
                    onReported();
                  }}
                  disabled={expired}
                  style={{ marginTop: 6 }}
                >
                  I've sent the payment
                </button>
                <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onClose}>
                  Pay later
                </button>
              </>
            )}
          </div>
        </div>

        {/* Good to know */}
        <div className="pay-goodtoknow">
          <div className="pay-gtk-title">Good to know</div>
          <ul>
            <li className="ok"><IconCheck width={14} height={14} /> Keep this page open until the payment completes</li>
            <li className="ok"><IconCheck width={14} height={14} /> Send the exact amount before the rate timer expires</li>
            <li className="no"><IconClose width={14} height={14} /> Payments below the minimum can't be processed</li>
            <li className="no"><IconClose width={14} height={14} /> Completed deposits are non-refundable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PayStep({
  n,
  active,
  done,
  title,
  sub,
}: {
  n: number;
  active: boolean;
  done: boolean;
  title: string;
  sub: string;
}) {
  return (
    <li className="pay-step" data-active={active} data-done={done}>
      <span className="pay-step-dot">{done ? <IconCheck width={14} height={14} /> : n}</span>
      <div>
        <div className="pay-step-title">{title}</div>
        <div className="pay-step-sub">{sub}</div>
      </div>
    </li>
  );
}
