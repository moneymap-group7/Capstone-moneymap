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

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function titleCaseCategory(value) {
  if (!value) return "—";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function getTopCategory(items) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  const sorted = [...items].sort((a, b) => Number(b.total) - Number(a.total));
  return titleCaseCategory(sorted[0]?.spendCategory);
}

function getRecurringItems(recurring) {
  return recurring?.items?.filter((it) => it.cadence !== "UNKNOWN") || [];
}

function StatCard({ label, value, tone = "default", subtext }) {
  return (
    <div className={`insightStatCard insightStatCard--${tone}`}>
      <div className="insightStatLabel">{label}</div>
      <div className="insightStatValue">{value}</div>
      {subtext ? <div className="insightStatSubtext">{subtext}</div> : null}
    </div>
  );
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

  const recurringItems = getRecurringItems(recurring);
  const categoryCount = byCategory?.items?.length || 0;
  const topCategory = getTopCategory(byCategory?.items);

  return (
  <div className="insightsPageShell">
    <div className="insightsGlow insightsGlowOne" />
    <div className="insightsGlow insightsGlowTwo" />

    <div className="insightsPage">
      <section className="insightsHero insightCard">
        <div className="insightsHeroLeft">
          <span className="insightsEyebrow">Analytics for your transactions</span>
          <h1 className="insightsTitle">Insights</h1>
          <p className="insightsHeroText">
            Review high-level financial trends, category spending, merchant
            activity, and recurring patterns for your selected date range.
          </p>
          <p className="insightsSub">
            Currently viewing: {applied.start} to {applied.end}
          </p>
        </div>

        <div className="insightsFilterCard">
          <div className="dateField">
            <label htmlFor="insights-start">Start</label>
            <input
              id="insights-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div className="dateField">
            <label htmlFor="insights-end">End</label>
            <input
              id="insights-end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <button className="applyBtn" onClick={onApply} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="insightsErrorWrap">
          <ErrorBox title="Error" errors={[error]} />
        </div>
      ) : null}

      <div className="insightStatsGrid">
        <StatCard
          label="Income"
          value={money(summary?.totalIncome)}
          tone="success"
          subtext="Total credits in range"
        />
        <StatCard
          label="Expense"
          value={money(summary?.totalExpense)}
          tone="danger"
          subtext="Total debits in range"
        />
        <StatCard
          label="Net"
          value={money(summary?.net)}
          tone={Number(summary?.net) < 0 ? "danger" : "success"}
          subtext="Income minus expense"
        />
        <StatCard
          label="Top Category"
          value={topCategory}
          subtext={`${categoryCount} categories found`}
        />
      </div>

      {loading ? (
        <div className="insightsLoadingCard">
          <div className="insightStateBox">
            <Spinner />
            <div className="insightStateTitle">Loading insights...</div>
            <div className="insightStateText">
              We are analyzing your selected transaction range now.
            </div>
          </div>
        </div>
      ) : (
        <div className="insightsGrid">
          <section className="insightCard">
            <div className="insightCardHeader">
              <div>
                <h2 className="insightCardTitle">Income vs Expense</h2>
                <p className="insightCardSub">
                  High-level totals for the selected range.
                </p>
              </div>
            </div>

            {!summary ? (
              <div className="insightStateBox compact">
                <div className="insightStateTitle">No summary data available</div>
                <div className="insightStateText">
                  There is no transaction activity for this date range yet.
                </div>
              </div>
            ) : (
              <div className="summaryList">
                <div className="summaryRow">
                  <div className="summaryLabelWrap">
                    <span className="summaryDot summaryDot--income" />
                    <span className="summaryLabel">Income</span>
                  </div>
                  <strong className="summaryValue summaryValue--income">
                    {money(summary.totalIncome)}
                  </strong>
                </div>

                <div className="summaryRow">
                  <div className="summaryLabelWrap">
                    <span className="summaryDot summaryDot--expense" />
                    <span className="summaryLabel">Expense</span>
                  </div>
                  <strong className="summaryValue summaryValue--expense">
                    {money(summary.totalExpense)}
                  </strong>
                </div>

                <div className="summaryRow summaryRow--net">
                  <div className="summaryLabelWrap">
                    <span className="summaryDot summaryDot--net" />
                    <span className="summaryLabel">Net</span>
                  </div>
                  <strong
                    className={`summaryValue ${
                      Number(summary.net) < 0
                        ? "summaryValue--expense"
                        : "summaryValue--income"
                    }`}
                  >
                    {money(summary.net)}
                  </strong>
                </div>
              </div>
            )}
          </section>

          <section className="insightCard">
            <div className="insightCardHeader">
              <div>
                <h2 className="insightCardTitle">Spend by Category</h2>
                <p className="insightCardSub">
                  Spending grouped by assigned category.
                </p>
              </div>
            </div>

            {byCategory?.items?.length ? (
              <div className="tableWrap">
                <table className="insightTable">
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
                        <td>
                          <span className="categoryPill">
                            {titleCaseCategory(it.spendCategory)}
                          </span>
                        </td>
                        <td className="right amountCell">{money(it.total)}</td>
                        <td className="right">{it.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="insightStateBox compact">
                <div className="insightStateTitle">No categorized spending</div>
                <div className="insightStateText">
                  No categorized transactions were found in this selected range.
                </div>
              </div>
            )}
          </section>

          <section className="insightCard">
            <div className="insightCardHeader">
              <div>
                <h2 className="insightCardTitle">Top Merchants</h2>
                <p className="insightCardSub">
                  Merchants with the highest activity in this range.
                </p>
              </div>
            </div>

            {topMerchants?.items?.length ? (
              <div className="tableWrap">
                <table className="insightTable">
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
                        <td className="merchantCell">{it.merchant}</td>
                        <td className="right amountCell">{money(it.total)}</td>
                        <td className="right">{it.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="insightStateBox compact">
                <div className="insightStateTitle">No merchant activity</div>
                <div className="insightStateText">
                  There are no merchant trends to show for this date range.
                </div>
              </div>
            )}
          </section>

          <section className="insightCard">
            <div className="insightCardHeader">
              <div>
                <h2 className="insightCardTitle">Recurring</h2>
                <p className="insightCardSub">
                  Detected recurring merchant patterns.
                </p>
              </div>
            </div>

            {recurringItems.length ? (
              <div className="tableWrap">
                <table className="insightTable">
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th className="right">Cadence</th>
                      <th className="right">Avg</th>
                      <th className="right">Next</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringItems.map((it) => (
                      <tr key={it.merchant}>
                        <td className="merchantCell">{it.merchant}</td>
                        <td className="right">
                          <span className="cadenceBadge">{it.cadence}</span>
                        </td>
                        <td className="right amountCell">
                          {money(it.avgAmount)}
                        </td>
                        <td className="right">
                          {formatDate(it.nextEstimatedDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="insightStateBox compact">
                <div className="insightStateTitle">No recurring patterns found</div>
                <div className="insightStateText">
                  Try a later end date or include more history for recurring
                  analysis.
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  </div>
);
}
