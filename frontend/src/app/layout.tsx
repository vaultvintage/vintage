import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Vintage Bank — Private Bank",
  description:
    "An elegant, secure digital banking experience. Wallet, transfers, virtual cards, loans and crypto — in one dark, refined dashboard.",
  icons: {
    icon: "https://res.cloudinary.com/dn0mb0rti/image/upload/v1783891683/logo_uimerq.png",
    apple:
      "https://res.cloudinary.com/dn0mb0rti/image/upload/v1783891683/logo_uimerq.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="grid-bg" />
        <div className="grid-glow" />
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
