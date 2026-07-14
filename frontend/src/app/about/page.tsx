import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  IconArrowUp,
  IconChart,
  IconCheck,
  IconGlobe,
  IconShield,
  IconTransfer,
  IconUser,
} from "@/components/Icons";
import { IMG, bgImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "About — Vintage Bank",
  description:
    "We're building the future of money. Vintage Bank is a digital-first bank for the modern world.",
};

const STATS = [
  { icon: <IconUser width={20} height={20} />, value: "2,500,000+", label: "Happy Customers" },
  { icon: <IconGlobe width={20} height={20} />, value: "150+", label: "Countries Served" },
  { icon: <IconChart width={20} height={20} />, value: "$50B+", label: "Assets Managed" },
  { icon: <IconShield width={20} height={20} />, value: "99%", label: "Uptime Rate" },
];

const VALUES = [
  { icon: <IconShield />, t: "Unshakeable Security", d: "Bank-grade 256-bit encryption, biometric auth, and 24/7 fraud monitoring keep your assets fortress-safe." },
  { icon: <IconTransfer />, t: "Lightning Speed", d: "Instant transfers, real-time notifications, and sub-second processing. Because your time matters." },
  { icon: <IconUser />, t: "Human-Centered", d: "24/7 human support, intuitive design, and features built from real customer feedback." },
  { icon: <IconGlobe />, t: "Borderless Banking", d: "Send money to 150+ countries with competitive rates. No boundaries, no limits." },
];

const MILESTONES = [
  { year: "2018", t: "The Dream Begins", d: "Founded with a vision to democratize banking for everyone." },
  { year: "2019", t: "First Million", d: "Reached 1M users and launched our mobile banking app." },
  { year: "2020", t: "Going Global", d: "Expanded to 50+ countries across 4 continents." },
  { year: "2021", t: "$200M Series B", d: "Secured funding from top-tier VCs to accelerate growth." },
  { year: "2022", t: "AI Revolution", d: "Launched an AI-powered financial advisor and smart insights." },
  { year: "2023", t: "2.5M Strong", d: "Celebrating our global community of pioneers." },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      {/* ===== HERO ===== */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundColor: "#05070a",
            backgroundImage: `url("${IMG.earth}")`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "rgba(4,7,11,0.82)",
          }}
        />
        <div className="shell" style={{ position: "relative", paddingTop: 72, paddingBottom: 72 }}>
          <div className="about-hero">
            <div className="fade-up">
              <span className="badge badge-success" style={{ marginBottom: 20 }}>
                <span className="badge-dot" /> Trusted by 2.5M+ worldwide
              </span>
              <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", lineHeight: 1.05, marginBottom: 18 }}>
                We're Building{" "}
                <span style={{ color: "var(--neon)" }}>
                  The Future of Money
                </span>
              </h1>
              <p style={{ fontSize: 18, color: "var(--text-2)", maxWidth: 520, marginBottom: 28 }}>
                Vintage Bank isn't just a bank — we're a movement. We're here to make financial freedom
                accessible to everyone, everywhere, without the old-school barriers.
              </p>
              <div className="flex items-center gap-md wrap">
                <Link href="/register" className="btn btn-primary">
                  Join the revolution <IconArrowUp width={16} height={16} style={{ transform: "rotate(45deg)" }} />
                </Link>
                <Link href="/#features" className="btn btn-ghost">Watch story</Link>
              </div>
            </div>

            <div className="stat-cards fade-up fade-up-2">
              {STATS.map((s) => (
                <div key={s.label} className="card card-hover">
                  <span className="text-neon" style={{ display: "inline-flex", marginBottom: 12 }}>{s.icon}</span>
                  <div className="stat-big">{s.value}</div>
                  <div style={{ color: "var(--text-2)", fontSize: 13.5, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .about-hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; }
          @media (max-width: 900px) { .about-hero { grid-template-columns: 1fr; gap: 32px; } }
        `}</style>
      </section>

      {/* ===== STORY ===== */}
      <section className="band">
        <div className="shell pad-y">
          <div className="grid-2">
            <div className="media-panel" style={bgImage(IMG.money, { minHeight: 320 })} />
            <div>
              <span className="mkt-eyebrow">Our story</span>
              <h2 className="mkt-title" style={{ marginBottom: 16 }}>Born From Frustration, Built With Purpose</h2>
              <p style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 14 }}>
                In 2018, our founders experienced firsthand how broken traditional banking was — hidden
                fees, slow transfers, terrible service. They knew there had to be a better way.
              </p>
              <p style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 22 }}>
                So they built Vintage Bank: a digital-first bank designed for the modern world. Today, we
                serve over 2.5 million customers across 150+ countries, processing billions in transactions
                while keeping fees transparent and support human.
              </p>
              <div className="flex gap-md wrap">
                <span className="badge badge-success"><span className="badge-dot" /> FDIC Insured up to $250,000</span>
                <span className="badge badge-success"><span className="badge-dot" /> Bank-Grade 256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section className="shell pad-y">
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span className="mkt-eyebrow">Our DNA</span>
          <h2 className="mkt-title">Values That Drive Everything</h2>
          <p style={{ color: "var(--text-2)", maxWidth: 560, margin: "12px auto 0" }}>
            These aren't just words on a wall. They're the principles behind every feature, every decision,
            every interaction.
          </p>
        </div>
        <div className="grid-4">
          {VALUES.map((v, i) => (
            <div key={v.t} className={`card card-hover card-pad value-card fade-up fade-up-${i + 1}`}>
              <span className="value-ico">{v.icon}</span>
              <h3 style={{ fontSize: 17, marginBottom: 8 }}>{v.t}</h3>
              <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6 }}>{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="band-dark">
        <div className="shell pad-y">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="mkt-eyebrow">Our journey</span>
            <h2 className="mkt-title">Milestones That Matter</h2>
          </div>
          <div className="timeline">
            {MILESTONES.map((m) => (
              <div key={m.year} className="tl-item">
                <span className="tl-dot"><IconCheck width={18} height={18} /></span>
                <div className="tl-year">{m.year}</div>
                <h4>{m.t}</h4>
                <p>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIAL ===== */}
      <section className="shell pad-y" style={{ textAlign: "center" }}>
        <span className="mkt-eyebrow">Real stories</span>
        <h2 className="mkt-title" style={{ marginBottom: 8 }}>Loved by Millions</h2>
        <div className="card card-pad" style={{ maxWidth: 700, margin: "28px auto 0", padding: 40 }}>
          <div className="text-neon" style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 18 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
              </svg>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.5, color: "var(--text-0)", marginBottom: 24 }}>
            “Vintage Bank completely transformed how we handle international payments. What used to take
            days now happens in seconds. Game changer!”
          </p>
          <div className="flex items-center gap-md" style={{ justifyContent: "center" }}>
            <span style={{ width: 48, height: 48, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(61,255,154,0.16)", border: "1px solid var(--border-strong)", color: "var(--neon-bright)", fontWeight: 700, fontFamily: "var(--font-serif)" }}>SM</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: "var(--text-0)", fontWeight: 600 }}>Sarah Mitchell</div>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>Startup Founder, TechVentures</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUSTED BY ===== */}
      <section className="band">
        <div className="shell pad-y-sm" style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Trusted by Industry Leaders</h3>
          <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 28 }}>Working with the world's best to bring you more</p>
          <div className="flex items-center wrap" style={{ justifyContent: "center", gap: 40, opacity: 0.7 }}>
            {["Deutsche Startups", "bitkom", "media.net", "proFund", "B/AND", "Creditreform"].map((b) => (
              <span key={b} style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--text-2)", letterSpacing: "0.02em" }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="shell pad-y">
        <div className="cta-band" style={{ padding: "clamp(40px, 6vw, 72px)", textAlign: "center" }}>
          <span className="badge badge-success" style={{ marginBottom: 18 }}><span className="badge-dot" /> Ready to start?</span>
          <h2 className="mkt-title" style={{ marginBottom: 14 }}>Your Financial Freedom Starts Here</h2>
          <p style={{ color: "var(--text-1)", fontSize: 16.5, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Join 2.5 million+ customers who've already made the switch. Open your account in minutes — no
            paperwork, no hidden fees.
          </p>
          <div className="flex items-center gap-md wrap" style={{ justifyContent: "center" }}>
            <Link href="/register" className="btn btn-primary">Open free account</Link>
            <Link href="/#contact" className="btn btn-ghost">Talk to sales</Link>
          </div>
          <div className="flex items-center wrap" style={{ justifyContent: "center", gap: 24, marginTop: 26, color: "var(--text-2)", fontSize: 13 }}>
            {["FDIC Insured", "256-bit Encryption", "24/7 Support"].map((b) => (
              <span key={b} className="flex items-center gap-sm">
                <span className="text-neon"><IconCheck width={15} height={15} /></span> {b}
              </span>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
