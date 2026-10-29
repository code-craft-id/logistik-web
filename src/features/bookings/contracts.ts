export type BookingListItem = {
  id: number;
  bookingNo: string | null;
  bookingDate: Date;
  branchId: number | null;
  customerId: number | null;
  senderName: string | null;
  receiverName: string | null;
  doNo: string | null;
  destination: string | null;
  koli: number | null;
  kilo: unknown | null;
  volume: unknown | null;
  biaya: unknown | null;
  status: string;
};

export type TransactionListItem = {
  id: number;
  awbNo: string | null;
  bookingId: number | null;
  transactionDate: Date;
  doNo: string | null;
  senderName: string | null;
  receiverName: string | null;
  originBranchId: number | null;
  destinationBranchId: number | null;
  koli: number | null;
  kilo: unknown | null;
  volume: unknown | null;
  biaya: unknown | null;
  status: string;
  courierId: number | null;
};
