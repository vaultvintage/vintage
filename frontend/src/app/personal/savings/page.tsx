import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHero } from "@/components/marketing/MarketingShell";
import { ComparisonTable, type CmpRow } from "@/components/marketing/ComparisonTable";
import { SavingsPromo } from "@/components/marketing/SavingsPromo";
import { IMG } from "@/lib/images";

export const metadata: Metadata = {
  title: "Savings Account — Vintage Bank",
  description: "Savings and money market accounts with competitive, attractive rates of return.",
};

const COLUMNS = [
  "Vintage Savings",
  "Wise Savings",
  "Premier Money Market",
  "Vintage Money Market",
  "Priority Money Market",
];

// [Vintage Sav, Wise Sav, Premier MM, Vintage MM, Priority MM]
const ROWS: CmpRow[] = [
  { label: "ATM/Debit Card", values: [true, true, true, true, true] },
  { label: "Interest Compounded Daily & Credited Monthly", values: [true, true, true, true, true] },
  { label: "Mobile Banking / Mobile Deposit", values: [true, true, true, true, true] },
  { label: "CheckFree Bill Pay", values: [false, true, true, true, true] },
  { label: "Zelle®", values: [false, false, true, true, true] },
  { label: "Online Banking", values: [true, true, true, true, true] },
  { label: "24/7 Telephone Banking", values: [true, true, true, true, true] },
  { label: "eStatements", values: [true, true, true, true, true] },
];

const DETAILS = [
  { name: "Vintage Savings", lede: "A convenient savings product, easy to maintain, with a competitive & attractive rate of return.", body: "$5,000 minimum deposit to open. Interest earned on every dollar. A minimum balance of $5,000 must be maintained each day to avoid a monthly service charge of $25.00." },
  { name: "Wise Savings", lede: "A convenient savings product, easy to maintain, with a competitive rate of return.", body: "$50 minimum deposit to open. Interest earned on every dollar. Service charges waived on custodial accounts until the minor reaches 18 years of age. A minimum balance of $500 must be maintained each day to avoid a monthly service charge of $5.00." },
  { name: "Premier Money Market", lede: "A high-yield solution to help you meet your goals while keeping your money liquid and available.", body: "No minimum deposit to open and no monthly service charges. Interest earned on every dollar. No minimum balance to earn interest." },
  { name: "Vintage Money Market", lede: "A convenient savings product with a competitive rate of return — making your money work for you.", body: "$5,000 minimum deposit to open. Interest earned on every dollar. A minimum balance of $5,000 must be maintained each day to avoid a monthly service charge of $25.00." },
  { name: "Priority Money Market", lede: "Savings should be a priority. So should letting your money work for you.", body: "$50 minimum deposit to open. A minimum balance of $2,500 must be maintained each day to earn interest, and to avoid a monthly service charge of $25.00." },
];

export default function SavingsPage() {
  return (
    <MarketingShell>
      <PageHero
        title="Savings Account"
        subtitle="Make a custom savings plan with products designed to help you reach your goals."
        crumb="Personal · Savings"
        image={IMG.coins}
      />

      <section className="shell pad-y">
        <ComparisonTable
          columns={COLUMNS}
          rows={ROWS}
          detailLinks={COLUMNS.map((c) => ({ label: `${c} Details`, href: "#details" }))}
        />

        <div id="details" style={{ marginTop: 48, maxWidth: 820 }}>
          {DETAILS.map((d) => (
            <div key={d.name} className="prod-block">
              <h3>{d.name}</h3>
              <p className="lede">{d.lede}</p>
              <p>{d.body}</p>
            </div>
          ))}

          <p style={{ color: "var(--text-2)", fontSize: 15, marginTop: 24 }}>
            For more information, please contact your local Customer Service Representative today!{" "}
            <strong className="text-neon">609.921.1700</strong>
          </p>
          <Link href="/register" className="btn btn-primary" style={{ marginTop: 20 }}>
            Open a savings account
          </Link>
        </div>
      </section>

      <SavingsPromo />
    </MarketingShell>
  );
}
