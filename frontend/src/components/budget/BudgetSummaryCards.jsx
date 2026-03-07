import ProgressBar from "./ProgressBar";

function formatMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `$${v.toFixed(0)}`;
}

export default function BudgetSummaryCards({ totals }) {
  const totalBudget = totals?.totalBudget ?? 0;
  const totalSpent = totals?.totalSpent ?? 0;
  const utilizationPercent = totals?.utilizationPercent ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">Total Budget</div>
        <div className="text-2xl font-semibold">{formatMoney(totalBudget)}</div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">Total Spent</div>
        <div className="text-2xl font-semibold">{formatMoney(totalSpent)}</div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Utilization</div>
          <div className="text-sm font-medium">
            {Number(utilizationPercent).toFixed(1)}%
          </div>
        </div>
        <ProgressBar value={utilizationPercent} />
      </div>
    </div>
  );
}