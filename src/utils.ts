export function getFormattedCurrency(value: number): string {
  if (typeof value !== "number" || isNaN(value)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
