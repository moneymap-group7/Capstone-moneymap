import BudgetHeader from "../components/budget/BudgetHeader";
import BudgetSummaryCards from "../components/budget/BudgetSummaryCards";
import BudgetTable from "../components/budget/BudgetTable";
import BudgetRightPanel from "../components/budget/BudgetRightPanel";
import "./budget.css";

const mock = {
  monthLabel: "February 2026",
  totals: { totalBudget: 2500, totalSpent: 1620, utilizationPercent: 64.8 },
  rows: [
    { category: "RENT", limit: 1200, spent: 1200 },
    { category: "GROCERIES", limit: 400, spent: 260 },
    { category: "TRANSPORTATION", limit: 250, spent: 190 },
    { category: "ENTERTAINMENT", limit: 150, spent: 220 },
    { category: "OTHER", limit: 500, spent: 250 },
  ],
  alerts: [
    { severity: "HIGH", title: "Entertainment over budget", detail: "Spent $220 of $150" },
    { severity: "MEDIUM", title: "Rent at 100%", detail: "Spent $1200 of $1200" },
  ],
};

function money(n) {
  return `$${Number(n).toFixed(0)}`;
}

export default function BudgetPage() {
  return (
    <div className="budgetPage">
      <div className="budgetHeader">
        <div>
          <h1 className="budgetTitle">Budget</h1>
          <p className="budgetSub">{mock.monthLabel}</p>
        </div>

        <div className="budgetActions">
          <button className="btn">Prev</button>
          <button className="btn">Next</button>
          <button className="btn">Add / Edit Budgets</button>
        </div>
      </div>

      <div className="summary">
        <div className="card">
          <div className="cardBody">
            <div className="kpiLabel">Total Budget</div>
            <div className="kpiValue">{money(mock.totals.totalBudget)}</div>
          </div>
        </div>

        <div className="card">
          <div className="cardBody">
            <div className="kpiLabel">Total Spent</div>
            <div className="kpiValue">{money(mock.totals.totalSpent)}</div>
          </div>
        </div>

        <div className="card">
          <div className="cardBody">
            <div className="kpiLabel">Utilization</div>
            <div className="kpiValue">{mock.totals.utilizationPercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHead">
            <h2 className="cardTitle">Budgets</h2>
            <p className="cardDesc">Set limits and monitor utilization per category.</p>
          </div>
          <div className="cardBody">
            <BudgetTable rows={mock.rows} />
          </div>
        </div>

        <BudgetRightPanel alerts={mock.alerts} />
      </div>
    </div>
  );
}