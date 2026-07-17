import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHero } from "@/components/marketing/MarketingShell";
import { Faq } from "@/components/marketing/Faq";
import { IconCheck, IconShield, IconBell } from "@/components/Icons";
import { IMG, bgImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "ICS/CDARS FDIC Coverage — Vintage Bank",
  description:
    "Extend your FDIC coverage beyond £250,000 with ICS® and CDARS® through Vintage Bank.",
};

const BENEFITS = [
  { t: "Rest assured.", d: "Deposits well into the millions are eligible for FDIC insurance protection. Because deposit accounts are not subject to floating net asset values, market volatility will not negatively impact principal." },
  { t: "Earn interest.", d: "Put cash balances to work in demand deposit accounts, money market deposit accounts, or CDs." },
  { t: "Keep it simple.", d: "Avoid opening multiple accounts with multiple institutions to protect your funds. Forego repo sweeps, tracking collateral, and manually consolidating statements from multiple banks." },
  { t: "Manage liquidity.", d: "Enjoy access to funds placed into demand deposit and money market deposit accounts. With CD placements, select from multiple terms to meet your liquidity needs." },
  { t: "Support your community.", d: "Feel good knowing the full amount of funds placed through ICS and CDARS can stay local to support lending opportunities that build a stronger community." },
];

const FAQS = [
  { q: "Why ICS?", a: "ICS gives you access to multi-million-pound FDIC protection through a single relationship with Vintage Bank, while keeping your funds working and accessible." },
  { q: "How can deposits greater than the standard FDIC insurance maximum be eligible for insurance by the FDIC?", a: "Through ICS, funds are placed with other institutions participating in IntraFi's network. Those network members provide access to FDIC coverage on deposits at their banks, so working with just our bank, you can access coverage through many." },
  { q: "How often can I access my funds?", a: "With demand and money market deposit account placements you enjoy convenient access to your funds, subject to program limits on certain withdrawal types." },
  { q: "How can I tell how many withdrawals I've made / have left in a given month?", a: "Your monthly statements and online banking clearly show your activity and any remaining withdrawals for money market deposit account placements." },
  { q: "Who has custody of my funds?", a: "Your funds are placed at FDIC-insured network institutions. Vintage Bank serves as your single point of contact and relationship manager throughout." },
  { q: "Who provides the additional FDIC insurance when my funds are placed using ICS?", a: "Through ICS, funds are placed with other institutions participating in IntraFi's network, and those network members provide you with access to FDIC insurance coverage on deposits at those banks. Working directly with just our bank, you can access coverage through many." },
  { q: "Is my account information safe?", a: "Yes. Your information is protected with bank-grade 256-bit encryption and strict confidentiality standards across the entire network." },
];

export default function IcsCdarsPage() {
  return (
    <MarketingShell>
      <PageHero
        title="ICS/CDARS FDIC Coverage"
        subtitle="Multi-million-pound FDIC protection through a single, simple relationship."
        crumb="Security · ICS/CDARS"
        image={IMG.vault}
      />

      <section className="shell pad-y">
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 40, alignItems: "start" }} className="ics-grid">
          {/* Main */}
          <div>
            <span className="mkt-eyebrow">FDIC Protection</span>
            <h2 className="mkt-title" style={{ marginBottom: 14 }}>Extend Your FDIC Coverage Beyond £250,000</h2>
            <p style={{ color: "var(--text-1)", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
              With <strong className="text-neon">ICS®</strong> and <strong className="text-neon">CDARS®</strong>, you can
              access multi-million-pound FDIC protection by working directly with your Customer Service
              Representatives at Vintage Bank.
            </p>

            <ul className="bullet-list" style={{ gap: 18 }}>
              {BENEFITS.map((b) => (
                <li key={b.t}>
                  <span className="b-tick"><IconCheck width={18} height={18} /></span>
                  <span>
                    <strong style={{ color: "var(--text-0)" }}>{b.t}</strong> {b.d}
                  </span>
                </li>
              ))}
            </ul>

            {/* Video panel */}
            <div style={{ marginTop: 40 }}>
              <span className="mkt-eyebrow">Learn how ICS/CDARS works</span>
              <div
                className="media-panel"
                style={bgImage(IMG.handshake, { minHeight: 300, marginTop: 12, cursor: "pointer" })}
              >
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-flex", width: 72, height: 72, borderRadius: "50%",
                      alignItems: "center", justifyContent: "center",
                      background: "var(--neon)", color: "var(--accent-ink)", marginBottom: 14,
                      boxShadow: "0 0 30px var(--neon-glow)",
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-0)" }}>
                    How do ICS & CDARS Work?
                  </div>
                  <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>Watch the 2-minute overview</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact card */}
          <aside style={{ position: "sticky", top: 96 }}>
            <div className="card card-pad">
              <span className="text-neon"><IconBell /></span>
              <h3 style={{ fontSize: 20, margin: "12px 0 8px" }}>Contact Us!</h3>
              <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.7, marginBottom: 18 }}>
                For more information about extending your FDIC coverage with ICS® and CDARS®, please
                contact your local Customer Service Representative today!
              </p>
              <Link href="/#contact" className="btn btn-primary btn-block">Contact us</Link>
              <div className="divider" />
              <div className="flex items-center gap-sm" style={{ color: "var(--text-2)", fontSize: 13.5 }}>
                <span className="text-neon"><IconShield width={16} height={16} /></span>
                FDIC insured · Bank-grade security
              </div>
            </div>
          </aside>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 64 }}>
          <h3 style={{ fontSize: 24, marginBottom: 20 }}>Frequently Asked Questions About ICS</h3>
          <Faq items={FAQS} defaultOpen={5} />

          <h3 style={{ fontSize: 24, margin: "40px 0 12px" }}>Frequently Asked Questions About CDARS</h3>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>
            If you have any questions about CDARS FDIC Protection, please contact your local Customer
            Service Representative at <strong className="text-neon">609.921.1700</strong>.
          </p>
        </div>
      </section>

      {/* Fine print */}
      <section className="band">
        <div className="shell pad-y-sm" style={{ color: "var(--text-3)", fontSize: 12.5, lineHeight: 1.7, fontStyle: "italic" }}>
          <p style={{ marginBottom: 14 }}>
            ¹ If a depositor is subject to restrictions with respect to the placement of funds in depository
            institutions, it is the responsibility of the depositor to determine whether the placement of
            funds through ICS or CDARS satisfies those restrictions.
          </p>
          <p style={{ marginBottom: 14 }}>
            ² When deposited funds are exchanged on a pound-for-pound basis with other institutions that
            use ICS or CDARS, our bank can use the full amount of a deposit for local lending, satisfying
            some depositors' local investment goals or mandates.
          </p>
          <p>
            Deposit placement through CDARS or ICS is subject to the terms, conditions, and disclosures in
            applicable agreements. A list identifying IntraFi network banks appears at{" "}
            <a href="https://www.intrafi.com/network-banks" className="text-neon" target="_blank" rel="noreferrer">
              intrafi.com/network-banks
            </a>
            . IntraFi, ICS and CDARS are registered service marks of IntraFi Network LLC.
          </p>
        </div>
      </section>

      <style>{`@media (max-width: 860px){ .ics-grid { grid-template-columns: 1fr !important; } }`}</style>
    </MarketingShell>
  );
}
