"use client";

import { useState } from "react";
import { IconPlus } from "@/components/Icons";

export interface FaqEntry {
  q: string;
  a: string;
}

export function Faq({ items, defaultOpen }: { items: FaqEntry[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen ?? null);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="faq-item" data-open={open === i}>
          <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <span className="faq-icon"><IconPlus width={18} height={18} /></span>
          </button>
          <div className="faq-a">
            <div className="faq-a-inner">{item.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
