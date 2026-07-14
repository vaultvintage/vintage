"use client";

// Catches errors thrown in the root layout itself. It replaces the whole
// document, so styles are inlined (globals.css is not guaranteed here).
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          background: "#04060a",
          color: "#c3d3cc",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ color: "#eafff5", fontSize: 26, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#7d8f89", maxWidth: 420 }}>
          The application ran into an unexpected problem. Please reload to continue.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "11px 20px",
            borderRadius: 12,
            border: "none",
            background: "#3dff9a",
            color: "#04140c",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
