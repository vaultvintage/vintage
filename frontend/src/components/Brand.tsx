export const LOGO_URL =
  "https://res.cloudinary.com/dn0mb0rti/image/upload/v1783891683/logo_uimerq.png";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "rgba(61,255,154,0.12)",
        border: "1px solid var(--border-strong)",
        boxShadow: "0 0 18px rgba(61,255,154,0.25)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_URL}
        alt="Vintage Bank"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </span>
  );
}

export function BrandWord({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size * 1.15,
          height: size * 1.15,
          borderRadius: "50%",
          background:
            "rgba(61,255,154,0.12)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 0 16px rgba(61,255,154,0.28)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="Vintage Bank — Private Bank"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: size * 0.62,
          fontWeight: 600,
          color: "var(--text-0)",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        Vintage Bank
      </span>
    </div>
  );
}
