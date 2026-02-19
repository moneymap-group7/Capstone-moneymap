import BudgetRow from "./BudgetRow";

export default function BudgetTable({ rows = [] }) {
  return (
    <div>
      <div className="tableHead">
        <div>Category</div>
        <div className="num">Limit</div>
        <div className="num">Spent</div>
        <div>Utilization</div>
        <div className="num">Edit</div>
      </div>

      {rows.map((r) => (r ? <BudgetRow key={r.category} row={r} /> : null))}
    </div>
  );
}