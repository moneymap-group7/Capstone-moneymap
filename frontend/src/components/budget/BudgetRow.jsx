import ProgressBar from "./ProgressBar";

function money(n) {
  return `$${Number(n).toFixed(0)}`;
}

function getUtilClass(utilization) {
  if (utilization >= 100) return "danger";
  if (utilization >= 75) return "warn";
  return "ok";
}

export default function BudgetRow({ row }) {
  if (!row) return null;

  const limit = Number(row.limit ?? 0);
  const spent = Number(row.spent ?? 0);
  const utilization = limit > 0 ? (spent / limit) * 100 : 0;

  const width = Math.max(0, Math.min(100, utilization));
  const over = utilization >= 100;
  const utilClass = getUtilClass(utilization);

  return (
    <div className="row">
      <div>{row.category}</div>
      <div className="num">{money(limit)}</div>
      <div className="num">{money(spent)}</div>

      <div className="progressWrap">
        <div className={`badge badge--${utilClass}`}>
          {utilization.toFixed(0)}% • {over ? "Over" : "OK"}
        </div>

        <div className="progressBar">
          <div
            className={`progressFill progressFill--${utilClass}`}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>

      <div className="num">
        <button className="btn">Edit</button>
      </div>
    </div>
  );
}