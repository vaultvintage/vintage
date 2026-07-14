"use client";

import { useEffect } from "react";
import { StatusScreen } from "@/components/StatusScreen";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability; replace with your logger of choice.
    console.error("Route error:", error);
  }, [error]);

  return (
    <StatusScreen
      title="This page hit a snag"
      message="An unexpected error interrupted the page. You can try again — your data is safe."
      primary={
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      }
    />
  );
}
