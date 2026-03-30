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

function normalizeYmd(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return "";
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

function dedupeRowsByCategory(rows = []) {
  const map = new Map();

  for (const row of rows) {
    if (!row?.spendCategory) continue;
    map.set(row.spendCategory, row);
  }

  return Array.from(map.values());
}

function dedupeAlertsByCategory(alerts = []) {
  const map = new Map();

  for (const alert of alerts) {
    if (!alert?.spendCategory) continue;
    map.set(alert.spendCategory, alert);
  }

  return Array.from(map.values());
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
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

      const rawRows = Array.isArray(json?.data) ? json.data : [];
      const rawAlerts = Array.isArray(json?.alerts) ? json.alerts : [];

      setRows(dedupeRowsByCategory(rawRows));
      setAlerts(dedupeAlertsByCategory(rawAlerts));
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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (deleteTarget && !deletingId) {
          setDeleteTarget(null);
          return;
        }

        if (editOpen) {
          setEditOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deletingId, editOpen]);

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

  const findBudgetIdForRow = async (row) => {
    if (row?.budgetId) return row.budgetId;

    const token = getToken();
    const start = toYmd(monthStart);
    const end = toYmd(monthEnd);

    const res = await fetch(`${API_BASE}/budgets`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && data.message) ||
        `Failed to load budgets (${res.status})`;
      throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
    }

    const budgets = Array.isArray(data) ? data : [];

    const match = budgets.find((b) => {
      const bCategory = b?.spendCategory ?? b?.name;
      const bStart = normalizeYmd(b?.startDate);
      const bEnd = normalizeYmd(b?.endDate);

      return (
        bCategory === row?.spendCategory &&
        bStart <= end &&
        (!bEnd || bEnd >= start)
      );
    });

    return match?.budgetId ?? match?.id ?? null;
  };

  const openDeleteModal = (row) => {
    setDeleteTarget(row);
    setError("");
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteTarget(null);
  };

  const confirmDeleteBudget = async () => {
    if (!deleteTarget) return;

    setError("");

    try {
      const resolvedBudgetId = await findBudgetIdForRow(deleteTarget);

      if (!resolvedBudgetId) {
        throw new Error("Could not find this budget id to delete.");
      }

      setDeletingId(resolvedBudgetId);

      const token = getToken();

      const res = await fetch(`${API_BASE}/budgets/${resolvedBudgetId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && typeof json === "object" && json.message) ||
          `Failed to delete budget (${res.status})`;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
      }

      setDeleteTarget(null);
      await fetchUtilization();
    } catch (e) {
      setError(e?.message || "Failed to delete budget");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="budgetPageShell">
      <div className="budgetGlow budgetGlowOne" />
      <div className="budgetGlow budgetGlowTwo" />

      <div className="budgetPage">
        <section className="budgetHero card">
          <div className="budgetHeroLeft">
            <span className="budgetEyebrow">Your personal finance workspace</span>
            <h1 className="budgetTitle">Budget</h1>
            <p className="budgetHeroText">
              Plan monthly spending, monitor category limits, and stay ahead of
              overspending with a cleaner budget overview.
            </p>
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
        </section>

        {error ? <div className="errorBox">{error}</div> : null}

        <div className="budgetStats">
          <div className="statCard card">
            <div className="statLabel">Total Budget</div>
            <div className="statValue">{formatMoney(totalBudget)}</div>
            <div className="statHelp">Planned category limits for this month</div>
          </div>

          <div className="statCard card">
            <div className="statLabel">Total Spent</div>
            <div className="statValue">{formatMoney(totalSpent)}</div>
            <div className="statHelp">Current spending recorded so far</div>
          </div>

          <div className="statCard card">
            <div className="statLabel">Utilization</div>
            <div className="statValue">{overallUtilization.toFixed(1)}%</div>
            <div className="statHelp">Overall usage of your monthly budget</div>
          </div>
        </div>

        <div className="budgetGrid">
          <section className="card budgetTableCard">
            <div className="sectionHead">
              <div>
                <h2>Budgets</h2>
                <p className="sectionSub">
                  Set limits and monitor utilization per category.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="budgetStateBox">
                <div className="budgetStateTitle">Loading budget data...</div>
                <div className="budgetStateText">
                  We are fetching your monthly budget utilization now.
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="budgetStateBox">
                <div className="budgetStateTitle">No budgets found for this month</div>
                <div className="budgetStateText">
                  Add category budgets to start tracking planned versus actual
                  spending.
                </div>
              </div>
            ) : (
              <div className="budgetTableWrap">
                <table className="budgetTable">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Limit</th>
                      <th>Spent</th>
                      <th>Utilization</th>
                      <th>Remaining</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const isDeleting =
                        deleteTarget?.spendCategory === row?.spendCategory &&
                        !!deletingId;

                      return (
                        <tr key={`${row.spendCategory}-${index}`}>
                          <td className="categoryCell">
                            <div className="categoryName">{row.spendCategory}</div>

                            <div className="progressWrap">
                              <div className="progressTrack">
                                <div
                                  className={`progressFill ${utilizationClass(
                                    Number(row.utilizationPercent || 0)
                                  )}`}
                                  style={{
                                    width: `${Math.min(
                                      Number(row.utilizationPercent || 0),
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>

                              <div className="progressMeta">
                                <span>{formatMoney(row.currentSpend)} spent</span>
                                <span>{formatMoney(row.budgetLimit)} budget</span>
                              </div>
                            </div>
                          </td>

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
                          <td className="actionCell">
                            <button
                              type="button"
                              className="deleteBudgetBtn"
                              onClick={() => openDeleteModal(row)}
                              disabled={!!deletingId}
                              title="Delete budget"
                              aria-label="Delete budget"
                            >
                              {isDeleting ? "..." : "🗑"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              <div className="budgetStateBox compact">
                <div className="budgetStateTitle">Loading alerts...</div>
                <div className="budgetStateText">
                  Budget warning data will appear here shortly.
                </div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="budgetStateBox compact">
                <div className="budgetStateTitle">No alerts for this month</div>
                <div className="budgetStateText">
                  You are within safe spending limits so far.
                </div>
              </div>
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
        {deleteTarget ? (
        <div className="modalOverlay" onMouseDown={closeDeleteModal}>
          <div className="modalCard confirmCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader confirmHeader">
              <div>
                <div className="modalTitle">Delete Budget</div>
                <div className="modalSub">
                  {deleteTarget?.spendCategory} • {monthLabel(monthStart)}
                </div>
              </div>

              <button className="btn" onClick={closeDeleteModal} disabled={!!deletingId}>
                Close
              </button>
            </div>

            <div className="confirmBody">
              Are you sure you want to delete this budget?
            </div>

            <div className="confirmActions">
              <button
                className="btn"
                onClick={closeDeleteModal}
                disabled={!!deletingId}
              >
                Cancel
              </button>

              <button
                className="btn confirmDeleteBtn"
                onClick={confirmDeleteBudget}
                disabled={!!deletingId}
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}