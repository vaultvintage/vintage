"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { humanizeError } from "@/lib/api";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Alert } from "@/components/ui";
import {
  IconArrowUp,
  IconBell,
  IconCard,
  IconChart,
  IconCheck,
  IconCrypto,
  IconGlobe,
  IconLoan,
  IconShield,
  IconTransfer,
  IconUser,
  IconWallet,
} from "@/components/Icons";
import { IMG, bgImage } from "@/lib/images";

/* ---------------- Hero slides ---------------- */
const SLIDES = [
  { eyebrow: "Smart Investments", title: "Grow With Confidence", text: "Partner with us to create tailored investment strategies that align with your goals and secure your future." },
  { eyebrow: "Everyday Banking", title: "Money That Moves With You", text: "Transfers, virtual cards and crypto cash-out — all in one refined, secure dashboard." },
  { eyebrow: "Global Reach", title: "Bank Beyond Borders", text: "Send and receive across countries with OTP-secured wire transfers and an IBAN for business." },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const active = SLIDES[slide];

  return (
    <div className="mkt">
      <MarketingNav />

      {/* ============ HERO ============ */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)" }}>
        {/* Photographic banner */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundColor: "#05070a",
            backgroundImage: `url("${IMG.earth}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Solid legibility overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "rgba(4,7,11,0.7)",
          }}
        />
        {/* Grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(61,255,154,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(61,255,154,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            WebkitMaskImage: "radial-gradient(ellipse 80% 90% at 30% 40%, #000, transparent 82%)",
            maskImage: "radial-gradient(ellipse 80% 90% at 30% 40%, #000, transparent 82%)",
          }}
        />
        <div className="shell" style={{ paddingTop: 72, paddingBottom: 80, position: "relative" }}>
          <div className="hero-grid">
            <div className="fade-up" key={slide}>
              <span className="mkt-eyebrow">{active.eyebrow}</span>
              <h1 style={{ fontSize: "clamp(38px, 6vw, 62px)", lineHeight: 1.05, marginBottom: 20, textShadow: "0 2px 30px rgba(0,0,0,0.6)" }}>
                {active.title.split(" ").slice(0, -1).join(" ")}{" "}
                <span style={{ color: "var(--neon)" }}>
                  {active.title.split(" ").slice(-1)}
                </span>
              </h1>
              <p style={{ fontSize: 18, color: "var(--text-2)", maxWidth: 520, marginBottom: 30 }}>
                {active.text}
              </p>
              <div className="flex items-center gap-md wrap">
                <Link href="/register" className="btn btn-primary">
                  Open an account <IconArrowUp width={16} height={16} style={{ transform: "rotate(45deg)" }} />
                </Link>
                <Link href="/#features" className="btn btn-ghost">Explore features</Link>
              </div>

              <div className="flex gap-sm" style={{ marginTop: 40 }}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                    style={{
                      width: i === slide ? 30 : 10,
                      height: 6,
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      background: i === slide ? "var(--neon)" : "rgba(61,255,154,0.25)",
                      boxShadow: i === slide ? "0 0 10px var(--neon-glow)" : "none",
                      transition: "all 0.3s var(--ease)",
                    }}
                  />
                ))}
              </div>
            </div>

            <HeroLogin />
          </div>
        </div>

        <style>{`
          .hero-grid { display: grid; grid-template-columns: 1.25fr 0.85fr; gap: 48px; align-items: center; }
          @media (max-width: 940px) { .hero-grid { grid-template-columns: 1fr; gap: 36px; } }
        `}</style>
      </section>

      {/* ============ BANK WISELY ============ */}
      <section id="about" className="band">
        <div className="shell pad-y" style={{ textAlign: "center" }}>
          <span className="mkt-eyebrow">Our promise</span>
          <h2 className="mkt-title" style={{ marginBottom: 18 }}>Bank Wisely</h2>
          <p style={{ color: "var(--text-2)", fontSize: 16.5, maxWidth: 720, margin: "0 auto 28px", lineHeight: 1.7 }}>
            We work tirelessly to provide the best products, services and technology — from personal
            banking and lending to a full range of business products. We believe our own success is
            achieved only when yours is, delivering a banking experience made uniquely for you.
          </p>
          <Link href="/register" className="btn btn-primary">Welcome, Vintage Bank customers</Link>
        </div>
      </section>

      {/* ============ HELOC (image right) ============ */}
      <section className="shell pad-y">
        <div className="grid-2">
          <div>
            <span className="mkt-eyebrow">Home Equity</span>
            <h2 className="mkt-title" style={{ marginBottom: 16 }}>Turn Your Dreams into Reality</h2>
            <p style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              Receive <strong style={{ color: "var(--neon-bright)" }}>0.25% below</strong> the current
              Prime Rate, variable for 6 months — as low as prime rate variable thereafter — with a
              Home Equity Line of Credit from Vintage Bank.
            </p>
            <Link href="/register" className="btn btn-ghost">Learn more</Link>
          </div>
          <div className="media-panel" style={bgImage(IMG.house)} />
        </div>
      </section>

      {/* ============ ZELLE (image left) ============ */}
      <section className="band">
        <div className="shell pad-y">
          <div className="grid-2">
            <div className="media-panel" style={bgImage(IMG.phone, { order: 0 })} />
            <div>
              <span className="mkt-eyebrow">Instant Payments</span>
              <h2 className="mkt-title" style={{ marginBottom: 16 }}>Send Money in Seconds</h2>
              <p style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                Who needs cash? Send money instantly and skip the trip to the ATM. Log into your online
                or mobile banking account to move funds to anyone, anywhere.
              </p>
              <Link href="/login" className="btn btn-ghost">Learn how it works</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUICK ACTIONS ============ */}
      <section className="shell pad-y-sm">
        <div className="grid-4">
          {[
            { icon: <IconUser width={30} height={30} />, label: "Open Account", href: "/register" },
            { icon: <IconGlobe width={30} height={30} />, label: "Diaspora Banking", href: "/register" },
            { icon: <IconBell width={30} height={30} />, label: "Contact Us", href: "/#contact" },
            { icon: <IconChart width={30} height={30} />, label: "Loan Calculator", href: "/loans" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="circle-action">
              <span className="circle-badge">{a.icon}</span>
              <div style={{ color: "var(--text-0)", fontWeight: 600, fontSize: 15 }}>{a.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ PRODUCT COLUMNS ============ */}
      <section className="shell pad-y-sm">
        <div className="grid-4">
          {[
            { t: "Personal Checking", d: "Looking out for you and your family, wherever life takes you — a complete line of personal checking accounts to fit your needs." },
            { t: "Save Wisely", d: "We're here to help you make a custom savings plan, with recommendations and products that help you reach your goals." },
            { t: "Switch Your Accounts", d: "It's easy to switch to us. Our free service helps you transfer your accounts from other institutions to Vintage Bank." },
            { t: "Current Promotions", d: "Special offers, especially for you. Check our first limited-time offers that help you maximize savings, earn rewards and more." },
          ].map((c) => (
            <div key={c.t} className="card card-hover card-pad">
              <span className="text-neon" style={{ display: "inline-flex", marginBottom: 12 }}><IconCheck /></span>
              <h3 style={{ fontSize: 17, marginBottom: 8 }}>{c.t}</h3>
              <p style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 14 }}>{c.d}</p>
              <Link href="/register" className="text-neon" style={{ fontSize: 13, fontWeight: 600 }}>Compare →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============ AMAZING FEATURES ============ */}
      <section id="features" className="band">
        <div className="shell pad-y">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mkt-eyebrow">Why Vintage Bank</span>
            <h2 className="mkt-title">Amazing Features To Enjoy</h2>
          </div>
          <div className="grid-3">
            {[
              { icon: <IconTransfer />, t: "Faster Payments", d: "Experience seamless and lightning-fast payment processing, ensuring your transactions complete in no time." },
              { icon: <IconGlobe />, t: "No Limits to International Transactions", d: "Send and receive money across borders without restrictions. Banking without boundaries." },
              { icon: <IconCard />, t: "Credit from Your Platform", d: "Access flexible credit options directly from your banking dashboard to empower your financial goals." },
            ].map((f, i) => (
              <div key={f.t} className={`card card-hover card-pad feature-hero fade-up fade-up-${i + 1}`}>
                <span style={{ display: "inline-flex", padding: 12, borderRadius: 12, background: "rgba(61,255,154,0.08)", border: "1px solid var(--border)", color: "var(--neon)", marginBottom: 18, alignSelf: "flex-start" }}>
                  {f.icon}
                </span>
                <h3 style={{ fontSize: 19, marginBottom: 10 }}>{f.t}</h3>
                <p style={{ color: "var(--text-2)", fontSize: 14.5 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMMUNITIES ============ */}
      <section className="band-dark">
        <div className="shell pad-y">
          <div className="grid-2">
            <div>
              <span className="mkt-eyebrow">Community</span>
              <h2 className="mkt-title" style={{ marginBottom: 16 }}>Expanding into New Communities</h2>
              <p style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                Vintage Bank is reaching new communities by expanding our footprint. Our team is
                dedicated to building strong relationships, and each year we donate hundreds of hours to
                worthy causes. Learn more about the great things we're doing where you live.
              </p>
              <div className="flex gap-md wrap">
                <Link href="/#contact" className="btn btn-primary">Branch locations</Link>
                <Link href="/#about" className="btn btn-ghost">See who we support</Link>
              </div>
            </div>
            <div className="grid gap-md">
              {[
                { name: "Horsforth Head Office", addr: "Broadway Hall, Broadway, Horsforth, Leeds LS18 4RS, United Kingdom", phone: "+44 791 561 3872" },
                { name: "24/7 Customer Support", addr: "Phone & live chat, every day of the week", phone: "+44 791 561 3872" },
              ].map((b) => (
                <div key={b.name} className="card card-hover card-pad">
                  <span className="mkt-eyebrow" style={{ marginBottom: 8 }}>New Location</span>
                  <h3 style={{ fontSize: 19, color: "var(--neon-bright)", marginBottom: 8 }}>{b.name}</h3>
                  <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 4 }}>{b.addr}</p>
                  <p className="mono" style={{ color: "var(--text-1)", fontSize: 13.5 }}>{b.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOREIGN ACCOUNT FEATURES ============ */}
      <section id="security" className="shell pad-y">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="mkt-eyebrow">Global accounts</span>
          <h2 className="mkt-title">Vintage Bank Foreign Account Features</h2>
        </div>
        <div className="grid-check">
          {[
            "100% Digital Signup",
            "No Account Opening Fees",
            "Zero Maintenance Charges",
            "An IBAN for Business Payments",
            "Withdraw To Your Local Accounts",
            "Comprehensive Account Statements",
            "Concise Payment Invoices",
            "Instant Transaction Notifications",
            "Anti-Fraud Protection",
            "Low Transaction Fees",
          ].map((f) => (
            <div key={f} className="check-item">
              <span className="check-tick"><IconCheck width={15} height={15} /></span>
              <span style={{ color: "var(--text-1)", fontSize: 15 }}>{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIAL ============ */}
      <section className="band">
        <div className="shell pad-y" style={{ textAlign: "center" }}>
          <span className="mkt-eyebrow">What our customers say</span>
          <div className="card card-pad" style={{ maxWidth: 720, margin: "24px auto 0", padding: 40 }}>
            <div className="text-neon" style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 18 }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} />)}
            </div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.5, color: "var(--text-0)", marginBottom: 24 }}>
              “Vintage Bank's integration with our financial systems has streamlined our
              operations. It's an indispensable tool that we rely on daily.”
            </p>
            <div className="flex items-center gap-md" style={{ justifyContent: "center" }}>
              <span style={{ width: 48, height: 48, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(61,255,154,0.16)", border: "1px solid var(--border-strong)", color: "var(--neon-bright)", fontWeight: 700, fontFamily: "var(--font-serif)" }}>ER</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "var(--text-0)", fontWeight: 600 }}>Ethan Ramirez</div>
                <div style={{ color: "var(--text-2)", fontSize: 13 }}>CFO, Global Enterprises</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section id="contact" className="shell pad-y">
        <div className="cta-band" style={{ padding: "clamp(32px, 5vw, 56px)" }}>
          <div className="cta-grid">
            <div>
              <h2 className="mkt-title" style={{ marginBottom: 14 }}>Get paid faster. Focus on what matters.</h2>
              <p style={{ color: "var(--text-1)", fontSize: 16, lineHeight: 1.7, marginBottom: 26, maxWidth: 460 }}>
                We know B2B payments can be complex and a hassle. We've simplified the process with
                FastPay — accept international payments in seconds. 
              </p>
              <Link href="/register" className="btn btn-primary">Create free account</Link>
            </div>
            <div className="media-panel" style={bgImage(IMG.laptop, { minHeight: 240 })} />
          </div>
        </div>
        <style>{`
          .cta-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; }
          @media (max-width: 860px) { .cta-grid { grid-template-columns: 1fr; gap: 28px; } }
        `}</style>
      </section>

      <MarketingFooter />

      {/* Floating help bubble */}
      <Link
        href="/#contact"
        className="btn btn-primary"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 80,
          borderRadius: 999,
          boxShadow: "0 12px 34px -8px var(--neon-glow)",
        }}
      >
        <IconBell width={16} height={16} /> Need Help?
      </Link>
    </div>
  );
}

/* ---------------- Hero login card ---------------- */
function HeroLogin() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="card card-pad fade-up" style={{ alignSelf: "start" }}>
        <span className="mkt-eyebrow">Online Banking</span>
        <h3 style={{ fontSize: 22, margin: "8px 0 6px" }}>Welcome back</h3>
        <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 20 }}>
          You're signed in as {user.email}.
        </p>
        <Link href="/dashboard" className="btn btn-primary btn-block">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="card fade-up" style={{ alignSelf: "start", overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", background: "rgba(61,255,154,0.05)" }}>
        <span className="mkt-eyebrow" style={{ margin: 0 }}>Online Banking</span>
      </div>
      <form onSubmit={submit} style={{ padding: 24 }}>
        {error && <Alert>{error}</Alert>}
        <div className="field">
          <label className="label">Email or phone</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@example.com" autoComplete="username" required />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <span className="spinner" /> : "Login"}
        </button>
        <div className="flex items-center justify-between" style={{ marginTop: 16, fontSize: 13 }}>
          <Link href="/register" className="text-neon" style={{ fontWeight: 600 }}>Open account</Link>
          <span className="flex items-center gap-sm" style={{ color: "var(--text-3)" }}>
            <IconShield width={14} height={14} /> Secured
          </span>
        </div>
      </form>
    </div>
  );
}

function Star() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
    </svg>
  );
}
