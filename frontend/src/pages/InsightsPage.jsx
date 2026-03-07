// frontend/src/pages/InsightsPage.jsx
import { useEffect, useMemo, useState } from "react";
import ErrorBox from "../components/common/ErrorBox";
import Spinner from "../components/common/Spinner";
import "./insights.css";

import {
  getSummary,
  getByCategory,
  getTopMerchants,
  getRecurring,
} from "../services/analyticsService";

function yyyyMmDd(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function lastNDaysRange(n) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - n);
  return { start: yyyyMmDd(start), end: yyyyMmDd(end) };
}

export default function InsightsPage() {
  const defaultRange = useMemo(() => lastNDaysRange(30), []);
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [applied, setApplied] = useState(defaultRange);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState(null);
  const [topMerchants, setTopMerchantsState] = useState(null);
  const [recurring, setRecurringState] = useState(null);

  async function loadAll(range) {
    setLoading(true);
    setError("");

    try {
      const [s, c, m, r] = await Promise.all([
        getSummary(range),
        getByCategory(range),
        getTopMerchants({ ...range, limit: 10 }),
        getRecurring({ months: 6, end: range.end }),
      ]);

      setSummary(s);
      setByCategory(c);
      setTopMerchantsState(m);
      setRecurringState(r);
    } catch (e) {
      setError(
        e?.message ||
          "Failed to load insights. Check backend is running and you are logged in."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied.start, applied.end]);

  function onApply() {
    if (!start || !end) {
      setError("Please select both start and end dates.");
      return;
    }
    if (start > end) {
      setError('"Start" date must be before or equal to "End" date.');
      return;
    }
    setApplied({ start, end });
  }

  return (
    <div className="insightsPage">
      <div className="insightsHeader">
        <div>
          <h1 className="insightsTitle">Insights</h1>
          <p className="insightsSub">Analytics for your selected date range.</p>
        </div>

        <div className="insightsControls">
          <div className="dateField">
            <label>Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="dateField">
            <label>End</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <button className="btn" onClick={onApply} disabled={loading}>
            Apply
          </button>
        </div>
      </div>

      {error ? <ErrorBox message={error} /> : null}

      {loading ? (
        <div className="insightsLoading">
          <Spinner />
        </div>
      ) : null}

      {!loading ? (
        <div className="insightsGrid">
          {/* Summary */}
          <div className="card">
            <div className="cardTitle">Income vs Expense</div>
            {!summary ? (
              <div className="muted">No data.</div>
            ) : (
              <div className="kv">
                <div className="kvRow">
                  <span>Income</span>
                  <strong>${summary.totalIncome}</strong>
                </div>
                <div className="kvRow">
                  <span>Expense</span>
                  <strong>${summary.totalExpense}</strong>
                </div>
                <div className="kvRow">
                  <span>Net</span>
                  <strong>${summary.net}</strong>
                </div>
              </div>
            )}
          </div>

          {/* By category */}
          <div className="card">
            <div className="cardTitle">Spend by Category</div>
            {byCategory?.items?.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="right">Total</th>
                    <th className="right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.items.map((it) => (
                    <tr key={it.spendCategory}>
                      <td>{it.spendCategory}</td>
                      <td className="right">${it.total}</td>
                      <td className="right">{it.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="muted">No categorized spending in this range.</div>
            )}
          </div>

          {/* Top merchants */}
          <div className="card">
            <div className="cardTitle">Top Merchants</div>
            {topMerchants?.items?.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th className="right">Total</th>
                    <th className="right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topMerchants.items.map((it) => (
                    <tr key={it.merchant}>
                      <td>{it.merchant}</td>
                      <td className="right">${it.total}</td>
                      <td className="right">{it.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="muted">No merchant activity in this range.</div>
            )}
          </div>

          {/* Recurring */}
          <div className="card">
            <div className="cardTitle">Recurring</div>
            {recurring?.items?.filter((it) => it.cadence !== "UNKNOWN").length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th className="right">Cadence</th>
                    <th className="right">Avg</th>
                    <th className="right">Next</th>
                  </tr>
                </thead>
                <tbody>
                  {recurring.items 
                    .filter((it) => it.cadence !== "UNKNOWN")
                    .map((it) => (
                        <tr key={it.merchant}>
                        <td>{it.merchant}</td>
                        <td className="right">{it.cadence}</td>
                        <td className="right">${it.avgAmount}</td>
                        <td className="right">
                        {it.nextEstimatedDate
                            ? String(it.nextEstimatedDate).slice(0, 10)
                            : "—"}
                        </td>
                        </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="muted">
                No recurring patterns found (try months=6 and a later end date).
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}