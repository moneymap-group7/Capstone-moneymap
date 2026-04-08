export class StatementListItemDto {
  statementId!: string;
  originalFileName!: string;
  bank!: string | null;
  status!: string;
  createdAt!: Date | string;
  size!: number;
  mimeType!: string;
}