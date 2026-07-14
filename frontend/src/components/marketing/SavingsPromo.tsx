import Link from "next/link";
import { IconWallet } from "@/components/Icons";
import { IMG, bgImage } from "@/lib/images";

export function SavingsPromo() {
  return (
    <section className="band">
      <div className="shell pad-y">
        <div className="grid-2">
          <div className="media-panel" style={bgImage(IMG.house, { minHeight: 260 })} />
          <div>
            <span className="mkt-eyebrow">Save with purpose</span>
            <h2 className="mkt-title" style={{ marginBottom: 14 }}>Turn your savings into something you want!</h2>
            <p style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              From simple Savings Accounts to goal-based solutions, we can help you meet your short- and
              long-term goals. Learn more about our savings accounts today.
            </p>
            <Link href="/personal/savings" className="btn btn-primary">
              <IconWallet width={16} height={16} /> Savings accounts
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
