"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";
import { IconBell } from "@/components/Icons";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="mkt">
      <MarketingNav />
      {children}
      <MarketingFooter />
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

export function PageHero({
  title,
  subtitle,
  crumb,
  image,
}: {
  title: string;
  subtitle?: string;
  crumb?: string;
  image?: string;
}) {
  const style = image
    ? ({ ["--img" as string]: `url("${image}")` } as React.CSSProperties)
    : undefined;
  return (
    <section className={`page-hero${image ? " has-img" : ""}`} style={style}>
      <div className="shell page-hero-inner fade-up" style={{ position: "relative", zIndex: 1 }}>
        {crumb && (
          <div className="breadcrumb">
            <Link href="/">Home</Link> · {crumb}
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
