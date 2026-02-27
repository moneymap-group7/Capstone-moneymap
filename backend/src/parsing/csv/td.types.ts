export type TdCsvRow = {
  date: string;           // "YYYY-MM-DD"
  description: string;
  withdrawal?: string;
  deposit?: string;
  balance?: string;
};