export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  date: string; // Format: DD/MM/YYYY
  description: string;
  amount: number;
  type: TransactionType;
}

export interface ExtractedData {
  transactions: Transaction[];
}
