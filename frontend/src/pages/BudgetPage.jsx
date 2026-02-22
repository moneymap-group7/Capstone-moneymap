// frontend/src/pages/BudgetPage.jsx
import { useEffect, useMemo, useState } from "react";
import BudgetTable from "../components/budget/BudgetTable";
import BudgetRightPanel from "../components/budget/BudgetRightPanel";
import BudgetEditModal from "../components/budget/BudgetEditModal";
import "./budget.css";

function money(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0";
  return `$${num.toFixed(0)}`;
}

function getToken() {
  return localStorage.getItem("mm_access_token");
}

function toYmd(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthLabelFromRange(startDate) {
  const m = startDate.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const y = startDate.getUTCFullYear();
  return `${m} ${y}`;
}

async function fetchUtilization({ start, end }) {
  const token = getToken();

  // If your frontend proxy is NOT set up, replace `/api` with `http://localhost:3000`
  const url = `/api/budgets/utilization?start=${start}&end=${end}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && data.message) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data; // { data: [...], alerts: [...] }
}

export default function BudgetPage() {
  // Month navigation (UTC-safe)
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const monthEnd = useMemo(() => {
    // last day of month: day 0 of next month
    return new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)
    );
  }, [monthStart]);

  const [rows, setRows] = useState([]); // backend utilization rows
  const [alerts, setAlerts] = useState([]); // backend alerts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    const start = toYmd(monthStart);
    const end = toYmd(monthEnd);

    fetchUtilization({ start, end })
      .then((res) => {
        if (!alive) return;
        setRows(Array.isArray(res?.data) ? res.data : []);
        setAlerts(Array.isArray(res?.alerts) ? res.alerts : []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Failed to load budget utilization");
        setRows([]);
        setAlerts([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [monthStart, monthEnd]);

  // Map backend row shape -> BudgetTable row shape
  const tableRows = useMemo(() => {
    return rows.map((r) => ({
      category: r.spendCategory,
      limit: Number(r.budgetLimit) || 0,
      spent: Number(r.currentSpend) || 0,
      utilizationPercent: Number(r.utilizationPercent) || 0,
      remainingAmount: Number(r.remainingAmount) || 0,
    }));
  }, [rows]);

  // Compute totals for KPI cards
  const totals = useMemo(() => {
    const totalBudget = tableRows.reduce((sum, r) => sum + (Number(r.limit) || 0), 0);
    const totalSpent = tableRows.reduce((sum, r) => sum + (Number(r.spent) || 0), 0);
    const utilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    return { totalBudget, totalSpent, utilizationPercent };
  }, [tableRows]);

  const monthLabel = useMemo(() => monthLabelFromRange(monthStart), [monthStart]);

  const goPrev = () => {
    setMonthStart((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));
  };

  const goNext = () => {
    setMonthStart((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
  };

  return (
    <div className="budgetPage">
      <div className="budgetHeader">
        <div>
          <h1 className="budgetTitle">Budget</h1>
          <p className="budgetSub">{monthLabel}</p>
        </div>

        <div className="budgetActions">
          <button className="btn" onClick={goPrev} disabled={loading}>
            ← Prev
          </button>
          <button className="btn" onClick={goNext} disabled={loading}>
            Next →
          </button>

          {/* Enable click: opens modal */}
          <button className="btn" onClick={() => setEditOpen(true)}>
            Add / Edit Budgets
          </button>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="cardBody" style={{ color: "#dc2626" }}>
            {error}
          </div>
        </div>
      ) : null}

      <div className="summary">
        <div className="card">
          <div className="cardBody">
            <div className="kpiLabel">Total Budget</div>
            <div className="kpiValue">{loading ? "…" : money(totals.totalBudget)}</div>
          </div>
        </div>

        <div className="card">
          <div className="cardBody">
            <div className="kpiLabel">Total Spent</div>
            <div className="kpiValue">{loading ? "…" : money(totals.totalSpent)}</div>
          </div>
        </div>

        <div className="card">
          <div className="cardBody">
            <div className="kpiLabel">Utilization</div>
            <div className="kpiValue">
              {loading ? "…" : `${totals.utilizationPercent.toFixed(1)}%`}
            </div>
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
            <BudgetTable rows={tableRows} />
          </div>
        </div>

        <BudgetRightPanel alerts={alerts} />
      </div>

      {/* Modal */}
      <BudgetEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        monthStart={monthStart}
        monthEnd={monthEnd}
        existingRows={rows}
        onSaved={() => {
          setEditOpen(false);
          // Trigger refresh for current month by resetting state to same value
          setMonthStart((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
        }}
      />
    </div>
  );
}