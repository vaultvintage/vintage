// Persists in-progress crypto deposit "invoices" so the payment modal survives
// a page refresh (until the user reports they've sent the money) and so a
// PENDING deposit row can reopen its payment page.

export interface StoredPayment {
  creditId: number;
  usd: number;
  usdt: string;
  asset: string;
  network: string;
  address: string;
  paymentId: string;
  currency: string;
  startedAt: number; // ms — when the rate window opened
  timerSeconds: number; // total rate-window length
  reported?: boolean; // user clicked "I've sent the payment"
}

const MAP_KEY = "vb_deposit_payments";
const ACTIVE_KEY = "vb_active_payment";

export function loadPayments(): Record<string, StoredPayment> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

function persist(map: Record<string, StoredPayment>) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function savePayment(p: StoredPayment) {
  const map = loadPayments();
  map[String(p.creditId)] = p;
  persist(map);
}

export function getPayment(creditId: number): StoredPayment | null {
  return loadPayments()[String(creditId)] ?? null;
}

export function removePayment(creditId: number) {
  const map = loadPayments();
  delete map[String(creditId)];
  persist(map);
}

/** Drop any stored payments whose deposit is no longer PENDING. */
export function prunePayments(pendingIds: Set<number>) {
  const map = loadPayments();
  let changed = false;
  for (const key of Object.keys(map)) {
    if (!pendingIds.has(Number(key))) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) persist(map);
}

export function getActive(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_KEY);
  return raw ? Number(raw) : null;
}

export function setActive(creditId: number | null) {
  if (creditId == null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, String(creditId));
}
