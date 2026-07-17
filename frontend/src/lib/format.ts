// The app is single-currency (GBP). We intentionally ignore any currency code
// coming from stored data so legacy "USD" wallets never render a "$" again.
export const CURRENCY_CODE = "GBP";

export function formatCurrency(
  value: string | number,
  _currency = CURRENCY_CODE
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `£${num.toFixed(2)}`;
  }
}

export function formatNumber(value: string | number, digits = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(first?: string, last?: string): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "FR";
}

export function maskCard(num?: string): string {
  if (!num) return "•••• •••• •••• ••••";
  const groups = num.match(/.{1,4}/g) ?? [];
  return groups.join(" ");
}
