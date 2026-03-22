import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import CategoryDropdown from "../components/CategoryDropdown";
import ErrorBox from "../components/common/ErrorBox";
import Spinner from "../components/common/Spinner";
import { fetchCategories } from "../services/categoriesService";
import { getCategoryBreakdown } from "../services/analyticsService";
import "./category-explorer.css";

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

function formatMerchantLabel(value) {
  if (!value) return "Unknown Merchant";

  const cleaned = String(value)
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("*", "")
    .replaceAll("  ", " ");

  if (cleaned.length <= 22) return cleaned;
  return `${cleaned.slice(0, 22)}…`;
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="categoryExplorerStatCard">
      <div className="categoryExplorerStatLabel">{label}</div>
      <div className="categoryExplorerStatValue">{value}</div>
      {subtext ? <div className="categoryExplorerStatSubtext">{subtext}</div> : null}
    </div>
  );
}

function TreemapTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
        {item.fullName || item.name}
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        Amount: <strong style={{ color: "#0f172a" }}>{money(item.value)}</strong>
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        Transactions: <strong style={{ color: "#0f172a" }}>{item.count ?? 0}</strong>
      </div>
    </div>
  );
}


function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value ?? 0;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        Total spent: <strong style={{ color: "#0f172a" }}>{money(value)}</strong>
      </div>
    </div>
  );
}

const TILE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#dc2626",
  "#65a30d",
  "#9333ea",
];

function CustomTreemapContent(props) {
  const { x, y, width, height, index, name, value } = props;

  if (width < 70 || height < 45) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={10}
          ry={10}
          fill={TILE_COLORS[index % TILE_COLORS.length]}
          stroke="#ffffff"
          strokeWidth={2}
        />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={TILE_COLORS[index % TILE_COLORS.length]}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <text
        x={x + 12}
        y={y + 22}
        fill="#ffffff"
        fontSize={13}
        fontWeight={700}
      >
        {name}
      </text>
      <text
        x={x + 12}
        y={y + 42}
        fill="rgba(255,255,255,0.95)"
        fontSize={12}
      >
        {money(value)}
      </text>
    </g>
  );
}

export default function Categories() {
  const defaultRange = useMemo(() => lastNDaysRange(180), []);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState("");
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [applied, setApplied] = useState(defaultRange);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [error, setError] = useState("");
  const [breakdown, setBreakdown] = useState(null);

  const sorted = useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [categories]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const data = await fetchCategories();
        if (!mounted) return;

        setCategories(data);
        setSelected((prev) => prev || data[0] || "");
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load categories";
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadBreakdown(selected, applied);
  }, [selected, applied.start, applied.end]);

  async function loadBreakdown(category, range) {
    try {
      setLoadingBreakdown(true);
      setError("");

      const data = await getCategoryBreakdown({
        category,
        start: range.start,
        end: range.end,
        limit: 8,
      });

      setBreakdown(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load category breakdown";
      setError(msg);
    } finally {
      setLoadingBreakdown(false);
    }
  }

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

  const treemapData =
    breakdown?.items?.map((item) => ({
      name: formatMerchantLabel(item.merchant),
      fullName: item.merchant,
      value: Number(item.total),
      count: item.count,
    })) || [];

  const monthlyData =
    breakdown?.monthly?.map((item) => ({
      month: item.month,
      total: Number(item.total),
    })) || [];

  if (loadingCategories) {
    return (
      <div className="categoryExplorerPage">
        <div className="categoryExplorerLoadingCard">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="categoryExplorerPage">
      <div className="categoryExplorerTopBar">
        <div>
          <h1 className="categoryExplorerTitle">Category Explorer</h1>
          <p className="categoryExplorerSub">
            Drill into merchant-level spending inside a selected category.
          </p>
        </div>

        <div className="categoryExplorerFilterCard">
          <CategoryDropdown
            categories={sorted}
            value={selected}
            onChange={setSelected}
            label="Category"
          />

          <div className="categoryExplorerDateField">
            <label htmlFor="category-start">Start</label>
            <input
              id="category-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div className="categoryExplorerDateField">
            <label htmlFor="category-end">End</label>
            <input
              id="category-end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <button
            className="categoryExplorerApplyBtn"
            onClick={onApply}
            disabled={loadingBreakdown}
          >
            Apply
          </button>
        </div>
      </div>

      {error ? (
        <div className="categoryExplorerErrorWrap">
          <ErrorBox title="Error" errors={[error]} />
        </div>
      ) : null}

      <div className="categoryExplorerStatsGrid">
        <StatCard
          label="Selected Category"
          value={titleCaseCategory(selected)}
          subtext="Current drill-down view"
        />
        <StatCard
          label="Total Spent"
          value={money(breakdown?.totalSpent)}
          subtext="Total expense in this category"
        />
        <StatCard
          label="Transactions"
          value={String(breakdown?.transactionCount ?? 0)}
          subtext="Debit transactions in range"
        />
        <StatCard
          label="Average Transaction"
          value={money(breakdown?.averageTransaction)}
          subtext={`Top merchant: ${breakdown?.topMerchant ?? "—"}`}
        />
      </div>

      {loadingBreakdown ? (
        <div className="categoryExplorerLoadingCard">
          <Spinner />
        </div>
      ) : (
        <div className="categoryExplorerGrid">
          <section className="categoryExplorerCard categoryExplorerCard--large">
            <div className="categoryExplorerCardHeader">
              <h2 className="categoryExplorerCardTitle">Merchant Treemap</h2>
              <p className="categoryExplorerCardSub">
                Larger tiles represent merchants with higher spending.
              </p>
            </div>

            <div className="categoryExplorerChartBody">
              {treemapData.length ? (
                <ResponsiveContainer width="100%" height={360}>
                  <Treemap
                    data={treemapData}
                    dataKey="value"
                    stroke="#ffffff"
                    fill="#2563eb"
                    content={<CustomTreemapContent />}
                  >
                    <Tooltip content={<TreemapTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                <div className="categoryExplorerEmpty">
                  No spending found in this category for the selected date range.
                </div>
              )}
            </div>
          </section>

          <section className="categoryExplorerCard">
            <div className="categoryExplorerCardHeader">
              <h2 className="categoryExplorerCardTitle">Top Merchants</h2>
              <p className="categoryExplorerCardSub">
                Highest merchant spend within this category.
              </p>
            </div>

            <div className="categoryExplorerList">
              {breakdown?.items?.length ? (
                breakdown.items.map((item, index) => (
                  <div className="categoryExplorerListRow" key={`${item.merchant}-${index}`}>
                    <div>
                      <div className="categoryExplorerMerchant">{item.merchant}</div>
                      <div className="categoryExplorerMeta">
                        {item.count} transaction{item.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="categoryExplorerAmount">{money(item.total)}</div>
                  </div>
                ))
              ) : (
                <div className="categoryExplorerEmpty">
                  No merchant breakdown is available for this category yet.
                </div>
              )}
            </div>
          </section>

          <section className="categoryExplorerCard categoryExplorerCard--wide">
            <div className="categoryExplorerCardHeader">
              <h2 className="categoryExplorerCardTitle">Monthly Trend</h2>
              <p className="categoryExplorerCardSub">
                Track this category over time.
              </p>
            </div>

            <div className="categoryExplorerChartBody">
              {monthlyData.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<MonthlyTooltip />} />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                      {monthlyData.map((_, index) => (
                        <Cell
                          key={`monthly-cell-${index}`}
                          fill={TILE_COLORS[index % TILE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="categoryExplorerEmpty">
                  No monthly spending trend is available for this date range.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}