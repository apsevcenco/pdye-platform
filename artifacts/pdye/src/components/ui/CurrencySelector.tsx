import { useCurrency, Currency, CURRENCY_SYMBOLS } from "@/lib/currency";

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "EUR", label: "€ EUR" },
  { code: "USD", label: "$ USD" },
  { code: "GBP", label: "£ GBP" },
];

interface CurrencySelectorProps {
  compact?: boolean;
}

export function CurrencySelector({ compact = false }: CurrencySelectorProps) {
  const { currency, setCurrency, loading } = useCurrency();

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {CURRENCIES.map(({ code }) => (
          <button
            key={code}
            onClick={() => setCurrency(code)}
            className={`px-1.5 py-0.5 text-[11px] font-bold font-sans tracking-wider transition-all duration-200 ${
              currency === code
                ? "text-primary border-b border-primary"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            {CURRENCY_SYMBOLS[code]}
          </button>
        ))}
        {loading && (
          <span className="w-2.5 h-2.5 border border-primary/30 border-t-primary rounded-full animate-spin ml-1 inline-block" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white/3 border border-white/8 px-1 py-0.5">
      {CURRENCIES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setCurrency(code)}
          className={`px-2.5 py-1 text-[11px] font-bold font-sans tracking-wider transition-all duration-200 ${
            currency === code
              ? "bg-primary/15 text-primary"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          {label}
        </button>
      ))}
      {loading && (
        <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin ml-1 inline-block flex-shrink-0" />
      )}
    </div>
  );
}
