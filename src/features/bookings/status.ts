export const TRANSACTION_STATUS = {
  OPEN: "Open",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  /** RETUR (back to office), owner decision 2026-11-19 on D-09. */
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [TRANSACTION_STATUS.OPEN]: [
    TRANSACTION_STATUS.IN_TRANSIT,
    TRANSACTION_STATUS.CANCELLED,
  ],
  [TRANSACTION_STATUS.IN_TRANSIT]: [
    TRANSACTION_STATUS.DELIVERED,
    TRANSACTION_STATUS.RETURNED,
    TRANSACTION_STATUS.CANCELLED,
  ],
  // Returned goods can be sent again or cancelled.
  [TRANSACTION_STATUS.RETURNED]: [
    TRANSACTION_STATUS.IN_TRANSIT,
    TRANSACTION_STATUS.CANCELLED,
  ],
  [TRANSACTION_STATUS.DELIVERED]: [],
  [TRANSACTION_STATUS.CANCELLED]: [],
};
