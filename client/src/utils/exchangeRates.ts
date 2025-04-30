export const exchangeRates = {
  PLN: 1,
  EUR: 0.22,
  USD: 0.24,
};

export type Currency = keyof typeof exchangeRates;

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  return (amount / exchangeRates[from]) * exchangeRates[to];
}

export function formatCurrency(amount: number, currency: Currency): string {
  const currencySymbols: Record<Currency, string> = {
    PLN: 'zł',
    EUR: '€',
    USD: '$'
  };

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[A-Z]{3}/, currencySymbols[currency]);
}