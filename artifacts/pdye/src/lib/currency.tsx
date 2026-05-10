import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "EUR" | "USD" | "GBP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  EUR: "Euro",
  USD: "US Dollar",
  GBP: "Pound Sterling",
};

export interface Rates {
  EUR: number;
  USD: number;
  GBP: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates;
  loading: boolean;
  lastUpdated: Date | null;
  formatPrice: (price: string) => string;
  convertAmount: (amount: number, from: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function parsePriceString(price: string): { amount: number; from: Currency } | null {
  if (!price) return null;
  // Detect currency by symbol OR by 3-letter code (case-insensitive).
  // Examples handled: "€ 5,200,000", "$5.2M", "GBP 4,750,000", "EUR 5200k", "5'200'000"
  let str = price.replace(/\s/g, "").replace(/'/g, "");
  let from: Currency = "EUR";
  if (str.includes("€") || /eur/i.test(str)) { from = "EUR"; str = str.replace(/€/g, "").replace(/eur/gi, ""); }
  else if (str.includes("$") || /usd/i.test(str)) { from = "USD"; str = str.replace(/\$/g, "").replace(/usd/gi, ""); }
  else if (str.includes("£") || /gbp/i.test(str)) { from = "GBP"; str = str.replace(/£/g, "").replace(/gbp/gi, ""); }
  // Detect magnitude suffix (k/m/b/t) BEFORE stripping commas, while still attached to the number.
  // After symbol removal we may still have "5.2M" or "5,200,000".
  const suffixMatch = str.match(/([kmbt])\b?$/i);
  let multiplier = 1;
  if (suffixMatch) {
    const ch = suffixMatch[1].toLowerCase();
    multiplier = ch === "k" ? 1_000 : ch === "m" ? 1_000_000 : ch === "b" ? 1_000_000_000 : 1_000_000_000_000;
    str = str.slice(0, suffixMatch.index);
  }
  // Now safe to remove thousand separators.
  str = str.replace(/,/g, "");
  // Strip any remaining non-numeric/non-decimal characters defensively.
  str = str.replace(/[^\d.]/g, "");
  const amount = parseFloat(str) * multiplier;
  if (isNaN(amount) || amount <= 0) return null;
  return { amount, from };
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try { return (localStorage.getItem("pdye_currency") as Currency) || "EUR"; }
    catch { return "EUR"; }
  });

  const [rates, setRates] = useState<Rates>({ EUR: 1, USD: 1.08, GBP: 0.86 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchRates() {
      setLoading(true);
      try {
        const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || "/api";
        const res = await fetch(`${apiBase}/fx/rates`);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled && data?.rates) {
          setRates({ EUR: 1, USD: data.rates.USD, GBP: data.rates.GBP });
          setLastUpdated(data.fetchedAt ? new Date(data.fetchedAt) : new Date());
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRates();
    return () => { cancelled = true; };
  }, []);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    try { localStorage.setItem("pdye_currency", c); } catch {}
  }

  function convertAmount(amount: number, from: Currency): number {
    const inEur = amount / rates[from];
    return inEur * rates[currency];
  }

  function formatPrice(price: string): string {
    if (!price) return price;
    const parsed = parsePriceString(price);
    if (!parsed) return price;
    const converted = convertAmount(parsed.amount, parsed.from);
    const sym = CURRENCY_SYMBOLS[currency];
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
    return `${sym} ${formatted}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, loading, lastUpdated, formatPrice, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
