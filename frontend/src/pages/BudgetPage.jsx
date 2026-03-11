import { useEffect, useMemo, useState } from "react";
import BudgetEditModal from "../components/budget/BudgetEditModal";
import "./budget.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("mm_access_token");
}

function formatMoney(n) {
  return `$${Number(n || 0).toFixed(0)}`;
}

function monthBoundsUTC(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();

  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 0, 0, 0, 0, 0));

  return { start, end };
}

function toYmd(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthLabel(date) {
  return date.toLocaleString("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function utilizationClass(percent) {
  if (percent >= 100) return "danger";
  if (percent >= 75) return "warn";
  return "ok";
}

function alertSeverityClass(severity) {
  switch (severity) {
    case "CRITICAL":
      return "critical";
    case "WARNING":
      return "warning";
    case "NEAR_LIMIT":
      return "nearLimit";
    default:
      return "nearLimit";
  }
}

function alertSeverityLabel(severity) {
  switch (severity) {
    case "CRITICAL":
      return "Critical";
    case "WARNING":
      return "Warning";
    case "NEAR_LIMIT":
      return "Near limit";
    default:
      return "Alert";
  }
}

export default function BudgetPage() {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  );
  const [rows, setRows] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const { start: monthStart, end: monthEnd } = useMemo(
    () => monthBoundsUTC(currentMonth),
    [currentMonth]
  );

  const fetchUtilization = async () => {
    setLoading(true);
    setError("");

    const token = getToken();
    const start = toYmd(monthStart);
    const end = toYmd(monthEnd);

    try {
      const res = await fetch(
        `${API_BASE}/budgets/utilization?start=${start}&end=${end}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && typeof json === "object" && json.message) ||
          `Failed to load utilization (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
      setAlerts(Array.isArray(json?.alerts) ? json.alerts : []);
    } catch (e) {
      setRows([]);
      setAlerts([]);
      setError(e?.message || "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilization();
  }, [currentMonth]);

  const totalBudget = rows.reduce(
    (sum, r) => sum + Number(r?.budgetLimit || 0),
    0
  );

  const totalSpent = rows.reduce(
    (sum, r) => sum + Number(r?.currentSpend || 0),
    0
  );

  const overallUtilization =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const goPrevMonth = () => {
    setCurrentMonth((prev) => {
      const y = prev.getUTCFullYear();
      const m = prev.getUTCMonth();
      return new Date(Date.UTC(y, m - 1, 1));
    });
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => {
      const y = prev.getUTCFullYear();
      const m = prev.getUTCMonth();
      return new Date(Date.UTC(y, m + 1, 1));
    });
  };

  return (
    <div className="budgetPage">
      <div className="budgetHeader">
        <div>
          <h1 className="budgetTitle">Budget</h1>
          <p className="budgetSub">{monthLabel(monthStart)}</p>
        </div>

        <div className="budgetActions">
          <button className="btn" onClick={goPrevMonth}>
            ← Prev
          </button>
          <button className="btn" onClick={goNextMonth}>
            Next →
          </button>
          <button className="btn btnPrimary" onClick={() => setEditOpen(true)}>
            Add / Edit Budgets
          </button>
        </div>
      </div>

      {error ? <div className="errorBox">{error}</div> : null}

      <div className="budgetStats">
        <div className="statCard">
          <div className="statLabel">Total Budget</div>
          <div className="statValue">{formatMoney(totalBudget)}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Total Spent</div>
          <div className="statValue">{formatMoney(totalSpent)}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Utilization</div>
          <div className="statValue">{overallUtilization.toFixed(1)}%</div>
        </div>
      </div>

      <div className="budgetGrid">
        <section className="card budgetTableCard">
          <h2>Budgets</h2>
          <p className="sectionSub">
            Set limits and monitor utilization per category.
          </p>

          <div className="budgetTableWrap">
            <table className="budgetTable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Limit</th>
                  <th>Spent</th>
                  <th>Utilization</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="5">No budgets found for this month.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.spendCategory}>
                      <td>{row.spendCategory}</td>
                      <td>{formatMoney(row.budgetLimit)}</td>
                      <td>{formatMoney(row.currentSpend)}</td>
                      <td>
                        <span
                          className={`utilBadge ${utilizationClass(
                            Number(row.utilizationPercent || 0)
                          )}`}
                        >
                          {Number(row.utilizationPercent || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatMoney(row.remainingAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card alertsCard">
          <div className="alertsHeader">
            <div>
              <h2>Alerts</h2>
              <p className="sectionSub">Threshold and overspending warnings.</p>
            </div>
            {!loading && alerts.length > 0 ? (
              <span className="alertsCount">{alerts.length}</span>
            ) : null}
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : alerts.length === 0 ? (
            <div className="alertsEmpty">No alerts for this month.</div>
          ) : (
            <div className="alertsList">
              {alerts.map((alert, idx) => (
                <div
                  key={`${alert?.spendCategory || "alert"}-${idx}`}
                  className={`alertItem ${alertSeverityClass(alert?.severity)}`}
                >
                  <div className="alertTopRow">
                    <div className="alertTitle">
                      {alert?.spendCategory || "Budget Alert"}
                    </div>
                    <span
                      className={`alertBadge ${alertSeverityClass(
                        alert?.severity
                      )}`}
                    >
                      {alertSeverityLabel(alert?.severity)}
                    </span>
                  </div>

                  <div className="alertBody">
                    {alert?.message || `${alert?.severity || "Notice"} alert`}
                  </div>

                  <div className="alertMeta">
                    <span>Budget: {formatMoney(alert?.budgetLimit)}</span>
                    <span>Spent: {formatMoney(alert?.currentSpend)}</span>
                    {Number(alert?.exceededAmount || 0) > 0 ? (
                      <span>Over: {formatMoney(alert?.exceededAmount)}</span>
                    ) : (
                      <span>Remaining: {formatMoney(alert?.remainingAmount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BudgetEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        monthStart={monthStart}
        monthEnd={monthEnd}
        existingRows={rows}
        onSaved={fetchUtilization}
      />
    </div>
  );
}