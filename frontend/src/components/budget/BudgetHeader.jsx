export default function BudgetHeader({ monthLabel }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Budget</h1>
        <p className="text-sm text-gray-500">{monthLabel}</p>
      </div>

      <div className="flex gap-2">
        <button className="rounded-xl border px-3 py-2 text-sm bg-white shadow-sm">
          Prev
        </button>
        <button className="rounded-xl border px-3 py-2 text-sm bg-white shadow-sm">
          Next
        </button>
        <button className="rounded-xl border px-3 py-2 text-sm bg-white shadow-sm">
          Add / Edit Budgets
        </button>
      </div>
    </div>
  );
}