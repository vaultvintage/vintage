import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHero } from "@/components/marketing/MarketingShell";
import { IconCheck } from "@/components/Icons";
import { IMG, bgImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Consumer Lending — Vintage Bank",
  description: "Home equity, personal loans and residential mortgages from Vintage Bank.",
};

const HELOAN = [
  "A loan which is fully disbursed at closing & repaid over the term requested.",
  "Minimum loan amount is $10,000",
  "Maximum term of 240 months",
  "Interest is fixed for the term",
  "No application fee*",
  "Fees are limited to recording fee",
  "Real estate tax service fee",
  "Title Insurance may be required",
];

const HELOC = [
  "Minimum loan amount is $10,000",
  "Competitive interest rates",
  "No application fee*",
  "Early termination fee if paid off or refinanced within 24 months of settlement",
  "Title Insurance may be required",
  "Property Insurance required",
  "Flood Insurance may be required",
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="bullet-list">
      {items.map((i) => (
        <li key={i}>
          <span className="b-tick"><IconCheck width={17} height={17} /></span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LendingPage() {
  return (
    <MarketingShell>
      <PageHero
        title="Consumer Lending"
        subtitle="Whether it's a home, a car, or life's next step — we help you borrow wisely."
        crumb="Personal · Consumer Lending"
        image={IMG.house}
      />

      <section className="shell pad-y">
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 40, alignItems: "start" }} className="lend-grid">
          {/* Main content */}
          <div>
            <div className="prod-block">
              <h3>Home Equity Loan</h3>
              <Bullets items={HELOAN} />
              <p style={{ marginTop: 14, color: "var(--text-2)" }}>Please contact your local Customer Service Representative for more details.</p>
            </div>

            <div className="prod-block">
              <h3>Home Equity Line of Credit</h3>
              <Bullets items={HELOC} />
              <p style={{ marginTop: 14, color: "var(--text-2)" }}>Please contact your local Customer Service Representative for more details.</p>
            </div>

            {/* Callout */}
            <div
              className="card card-pad"
              style={{ margin: "24px 0", borderColor: "var(--border-strong)", textAlign: "center", background: "rgba(61,255,154,0.05)" }}
            >
              <p style={{ color: "var(--text-0)", fontSize: 16, lineHeight: 1.7 }}>
                Whether it's a Checking Account with no service fees, a Savings Account that helps your
                child start managing money, or a Home Equity Loan to cover home renovations — we help you
                <strong className="text-neon"> Bank Wisely</strong>.
              </p>
            </div>

            <div className="prod-block">
              <h3>Personal Loan</h3>
              <p className="lede">Flexible borrowing to finance short-term needs.</p>
              <ul className="bullet-list" style={{ marginTop: 8 }}>
                <li><span className="b-tick"><IconCheck width={17} height={17} /></span> Secured by a CD or Savings Account</li>
                <li><span className="b-tick"><IconCheck width={17} height={17} /></span> Minimum amount $5,000</li>
              </ul>
              <p style={{ marginTop: 14, color: "var(--text-2)" }}>Please contact your local Customer Service Representative for more details.</p>
              <Link href="/loans" className="btn btn-ghost" style={{ marginTop: 16 }}>View loan rates</Link>
            </div>

            <div className="prod-block">
              <h3>Residential Mortgage</h3>
              <p className="lede">Owning a home is a dream. Let us help make it a reality.</p>
              <ul className="bullet-list" style={{ marginTop: 8 }}>
                <li><span className="b-tick"><IconCheck width={17} height={17} /></span> Financing for purchases & refinancing</li>
                <li><span className="b-tick"><IconCheck width={17} height={17} /></span> Flexible mortgage options available</li>
                <li><span className="b-tick"><IconCheck width={17} height={17} /></span> First-Time Home Buying options available</li>
              </ul>
              <p style={{ marginTop: 14, color: "var(--text-2)" }}>Please contact your local Customer Service Representative for more details.</p>
            </div>

            <p style={{ color: "var(--text-2)", fontSize: 15, marginTop: 20 }}>
              For more information and details on any of our products and services, please contact your
              local Customer Service Representative today! <strong className="text-neon">609.921.1700</strong>
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 10 }}>*Other terms and fees may still apply.</p>
          </div>

          {/* Side promos */}
          <aside className="grid gap-md" style={{ position: "sticky", top: 96 }}>
            <div className="card card-hover" style={{ overflow: "hidden" }}>
              <div className="media-panel" style={bgImage(IMG.handshake, { minHeight: 150, borderRadius: 0, border: "none" })} />
              <div style={{ padding: 20 }}>
                <h4 style={{ fontSize: 17, marginBottom: 8 }}>The Rewards You Deserve.</h4>
                <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>
                  Earn points when you make purchases with your Visa® Debit Card from Vintage Bank
                  when you enroll with uChoose Rewards®. Start earning points today!
                </p>
                <Link href="/register" className="btn btn-ghost btn-sm">uChoose Rewards®</Link>
              </div>
            </div>

            <div className="card card-hover" style={{ overflow: "hidden" }}>
              <div className="media-panel" style={bgImage(IMG.phone, { minHeight: 150, borderRadius: 0, border: "none" })} />
              <div style={{ padding: 20 }}>
                <h4 style={{ fontSize: 17, marginBottom: 8 }}>Checking that's Wise.</h4>
                <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>
                  Something basic, something easy… something wise. Already packed with great features — you
                  can receive $100 when you open a Wise Checking Account.*
                </p>
                <Link href="/personal/checking" className="btn btn-ghost btn-sm">Wise Checking</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <style>{`@media (max-width: 860px){ .lend-grid { grid-template-columns: 1fr !important; } }`}</style>
    </MarketingShell>
  );
}
