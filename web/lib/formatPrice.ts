// Mirrors utility/formatPrice.js on the Express side: prices arrive from the
// API as kuruş integers (1/100 TL) to avoid JS floating-point rounding.
export function formatPriceNumber(kurus: number): string {
  const tl = (kurus || 0) / 100;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tl);
}

export function formatPrice(kurus: number): string {
  return `${formatPriceNumber(kurus)} TL`;
}
