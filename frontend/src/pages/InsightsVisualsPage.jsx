import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import ErrorBox from "../components/common/ErrorBox";
import Spinner from "../components/common/Spinner";
import { getSummary, getByCategory, getTopMerchants, getMonthly } from "../services/analyticsService";
import "./insights-visuals.css";

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

function StatCard({ label, value, tone = "default", subtext }) {
  return (
    <div className={`visualStatCard visualStatCard--${tone}`}>
      <div className="visualStatLabel">{label}</div>
      <div className="visualStatValue">{value}</div>
      {subtext ? <div className="visualStatSubtext">{subtext}</div> : null}
    </div>
  );
}

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#9333ea",
  "#65a30d",
  "#c2410c",
  "#0f766e",
];

export default function InsightsVisualsPage() {
  const defaultRange = useMemo(() => lastNDaysRange(180), []);
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [applied, setApplied] = useState(defaultRange);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState(null);
  const [topMerchants, setTopMerchants] = useState(null);
  const [monthly, setMonthly] = useState(null);

  async function loadAll(range) {
    setLoading(true);
    setError("");

    try {
      const [s, c, m, monthlyData] = await Promise.all([
        getSummary(range),
        getByCategory(range),
        getTopMerchants({ ...range, limit: 8 }),
        getMonthly(range),
      ]);

      setSummary(s);
      setByCategory(c);
      setTopMerchants(m);
      setMonthly(monthlyData);
    } catch (e) {
      setError(
        e?.message ||
          "Failed to load visuals. Check backend is running and you are logged in."
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

  const pieData =
  byCategory?.items
    ?.filter((item) => item.spendCategory !== "INCOME")
    .map((item) => ({
      name: titleCaseCategory(item.spendCategory),
      value: Number(item.total),
    })) || [];

  const merchantsData =
    topMerchants?.items?.map((item) => ({
      merchant: item.merchant,
      total: Number(item.total),
    })) || [];

  const monthlyIncomeExpense =
    monthly?.monthly?.map((item) => ({
      month: item.month,
      income: Number(item.income),
      expense: Number(item.expense),
    })) || [];

  const monthlyNet =
    monthly?.monthly?.map((item) => ({
      month: item.month,
      net: Number(item.net),
    })) || [];

  return (
    <div className="insightsVisualsPage">
      <div className="insightsVisualsTopBar">
        <div>
          <h1 className="insightsVisualsTitle">Insights Visuals</h1>
          <p className="insightsVisualsSub">
            Interactive charts for categorized spending and trends.
          </p>
        </div>

        <div className="insightsVisualsFilterCard">
          <div className="visualDateField">
            <label htmlFor="visuals-start">Start</label>
            <input
              id="visuals-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div className="visualDateField">
            <label htmlFor="visuals-end">End</label>
            <input
              id="visuals-end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <button className="visualApplyBtn" onClick={onApply} disabled={loading}>
            Apply
          </button>
        </div>
      </div>

      {error ? (
        <div className="insightsVisualsErrorWrap">
          <ErrorBox title="Error" errors={[error]} />
        </div>
      ) : null}

      <div className="visualStatsGrid">
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
      </div>

      {loading ? (
        <div className="visualLoadingCard">
          <Spinner />
        </div>
      ) : (
        <div className="visualChartsGrid">
          <section className="visualChartCard">
            <div className="visualChartHeader">
              <h2 className="visualChartTitle">Spend by Category</h2>
              <p className="visualChartSub">
                Expense distribution across categories.
              </p>
            </div>
            <div className="visualChartBody">
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={55}
                      paddingAngle={3}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="visualEmpty">No category data for this range.</div>
              )}
            </div>
          </section>

          <section className="visualChartCard">
            <div className="visualChartHeader">
              <h2 className="visualChartTitle">Top Merchants</h2>
              <p className="visualChartSub">
                Highest merchant spending in the selected range.
              </p>
            </div>
            <div className="visualChartBody">
              {merchantsData.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={merchantsData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                    <YAxis
                      type="category"
                      dataKey="merchant"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => money(value)} />
                    <Bar dataKey="total" fill="#2563eb" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="visualEmpty">No merchant data for this range.</div>
              )}
            </div>
          </section>

          <section className="visualChartCard">
            <div className="visualChartHeader">
              <h2 className="visualChartTitle">Monthly Income vs Expense</h2>
              <p className="visualChartSub">
                Compare credits and debits month by month.
              </p>
            </div>
            <div className="visualChartBody">
              {monthlyIncomeExpense.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyIncomeExpense}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#16a34a" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" fill="#dc2626" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="visualEmpty">No monthly data for this range.</div>
              )}
            </div>
          </section>

          <section className="visualChartCard">
            <div className="visualChartHeader">
              <h2 className="visualChartTitle">Monthly Net Trend</h2>
              <p className="visualChartSub">
                Net movement over time for the selected period.
              </p>
            </div>
            <div className="visualChartBody">
              {monthlyNet.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyNet}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="visualEmpty">No net trend data for this range.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}