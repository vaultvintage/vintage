"use client";

import { useState } from "react";

/**
 * Full-screen entry gate shown on first load.
 * Yes -> reveal the site. No -> try to close the tab, otherwise go blank.
 */
export function EnterGate() {
  const [status, setStatus] = useState<"pending" | "in" | "out">("pending");

  if (status === "in") return null;

  if (status === "out") {
    // Declined: nothing to show.
    return <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--bg-1)" }} />;
  }

  function decline() {
    // Browsers only allow closing script-opened tabs; fall back to a blank screen.
    try {
      window.open("", "_self");
      window.close();
    } catch {
      /* ignore */
    }
    setStatus("out");
  }

  return (
    <div className="gate-overlay" role="dialog" aria-modal="true" aria-labelledby="gate-q">
      <div className="gate-card">
        <h2 id="gate-q" className="gate-q">Proceed to the Platform?</h2>
        <div className="gate-actions">
          <button className="btn btn-primary" onClick={() => setStatus("in")}>Yes</button>
          <button className="btn btn-ghost" onClick={decline}>No</button>
        </div>
      </div>
    </div>
  );
}
