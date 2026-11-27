/** Form fields holding Rupiah amounts: shown with thousand separators. */
export const MONEY_FIELDS = new Set([
  "amount",
  "biaya",
  "price",
  "pricePerKg",
  "totalCost",
  "cost",
  "codValue",
  "codFee",
  "insuranceFee",
  "otherFee",
  "goodsValue",
  "packingFee",
  "pickupFee",
]);
export const isMoneyField = (name: string) => MONEY_FIELDS.has(name);
