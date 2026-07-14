import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, PageHero } from "@/components/marketing/MarketingShell";
import { ComparisonTable, type CmpRow } from "@/components/marketing/ComparisonTable";
import { SavingsPromo } from "@/components/marketing/SavingsPromo";
import { IMG } from "@/lib/images";

export const metadata: Metadata = {
  title: "Personal Checking — Vintage Bank",
  description: "Wise, Premier and Classic checking accounts built around how you live.",
};

const COLUMNS = ["Wise Checking", "Premier Checking", "Classic Checking (55+)"];

// Feature availability per column: [Wise, Premier, Classic]
const ROWS: CmpRow[] = [
  { label: "ATM/Debit Card", values: [true, true, true] },
  { label: "Interest Compounded Daily & Credited Monthly", values: [false, true, true] },
  { label: "Mobile Banking / Mobile Deposit", values: [true, true, true] },
  { label: "CardValet®", values: [true, true, true] },
  { label: "CheckFree Bill Pay", values: [true, true, true] },
  { label: "Zelle®", values: [true, true, true] },
  { label: "Online Banking", values: [true, true, true] },
  { label: "24/7 Telephone Banking", values: [true, true, true] },
  { label: "eStatements", values: [true, true, true] },
  { label: "Free Standard Checks", values: [false, false, true] },
];

const DETAILS = [
  {
    name: "Wise Checking",
    lede: "Something basic, something easy, something wise.",
    body: "Minimum $50 deposit to open. No minimum balance required. No monthly service charges. Unlimited check-writing benefits.",
  },
  {
    name: "Premier Checking",
    lede: "All the convenience of full-featured checking with added interest benefits.",
    body: "$50 deposit to open. Maintain $1,000 daily for interest. To avoid a $25.00 monthly service charge, maintain a daily balance of $1,000.",
  },
  {
    name: "Classic Checking",
    lede: "For those 55+ seeking simplicity and value.",
    body: "$50 deposit to open. Maintain $500 daily for interest. Includes free standard checks for life. Avoid a $25.00 monthly service charge by maintaining a $500 balance.",
  },
];

export default function CheckingPage() {
  return (
    <MarketingShell>
      <PageHero
        title="Personal Checking"
        subtitle="Looking out for you and your family, wherever life takes you."
        crumb="Personal · Checking"
        image={IMG.phone}
      />

      <section className="shell pad-y">
        <ComparisonTable
          columns={COLUMNS}
          rows={ROWS}
          detailLinks={COLUMNS.map((c) => ({ label: `${c.replace(" (55+)", "")} Details`, href: "#details" }))}
        />

        <div id="details" style={{ marginTop: 48, maxWidth: 760 }}>
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
            Open a checking account
          </Link>
        </div>
      </section>

      <SavingsPromo />
    </MarketingShell>
  );
}
