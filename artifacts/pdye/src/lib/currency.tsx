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
  const str = price.replace(/\s/g, "").replace(/,/g, "").replace(/'/g, "");
  let from: Currency = "EUR";
  let numStr = str;
  if (str.includes("€")) { from = "EUR"; numStr = str.replace(/€/g, ""); }
  else if (str.includes("$")) { from = "USD"; numStr = str.replace(/\$/g, ""); }
  else if (str.includes("£")) { from = "GBP"; numStr = str.replace(/£/g, ""); }
  const amount = parseFloat(numStr);
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
        const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,GBP");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled) {
          setRates({ EUR: 1, USD: data.rates.USD, GBP: data.rates.GBP });
          setLastUpdated(new Date());
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
    const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(converted));
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
