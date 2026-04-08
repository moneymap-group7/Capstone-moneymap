import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
        pointerEvents: "none",
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
        pointerEvents: "none",
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
  const { x, y, width, height, name, value, color } = props;

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
          fill={color || "#2563eb"}
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
        fill={color || "#2563eb"}
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

export default function CategoryExplorerPage() {
  const defaultRange = useMemo(() => lastNDaysRange(180), []);
  const location = useLocation();
  const preselectedCategory = location.state?.category || "";
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState("");
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [applied, setApplied] = useState(defaultRange);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [error, setError] = useState("");
  const [breakdown, setBreakdown] = useState(null);

  function getCategoryPalette(category) {
    const palettes = {
      GROCERIES: ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
      TRANSPORTATION: ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"],
      EDUCATION: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"],
      FOOD_AND_DINING: ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"],
      UTILITIES: ["#0891b2", "#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc", "#cffafe"],
      UNCATEGORIZED: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"],
      SHOPPING: ["#65a30d", "#84cc16", "#a3e635", "#bef264", "#d9f99d", "#ecfccb"],
      OTHER: ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9"],
    };

    return palettes[category] || palettes.OTHER;
  }

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
        setSelected((prev) => prev || preselectedCategory || data[0] || "");
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

  const palette = getCategoryPalette(selected);

  const treemapData =
    breakdown?.items?.map((item, index) => ({
      name: formatMerchantLabel(item.merchant),
      fullName: item.merchant,
      value: Number(item.total),
      count: item.count,
      color: palette[index % palette.length],
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
      <div className="categoryExplorerShell"></div>
      <div className="categoryExplorerTopBar">
        <div className="categoryExplorerHeroCopy">
          <span className="categoryExplorerBadge">Merchant drill-down workspace</span>
          <h1 className="categoryExplorerTitle">Category Explorer</h1>
          <p className="categoryExplorerSub">
            Drill into merchant-level spending inside a selected category.
          </p>
          <div className="categoryExplorerAppliedRange">
            Viewing range: {applied.start} to {applied.end}
          </div>
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
            className="categoryOverviewDetailBtn"
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
          <section className="categoryExplorerCard categoryExplorerCard--large categoryExplorerCard--treemap">
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
                    <Tooltip
                      content={<TreemapTooltip />}
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: "none" }}
                      cursor={false}
                    />
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                <div className="categoryExplorerEmpty">
                  No spending found in this category for the selected date range.
                </div>
              )}
            </div>
          </section>

          <section className="categoryExplorerCard categoryExplorerCard--side">
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
  <div className="categoryExplorerListLeft">
    <div
      className="categoryExplorerMerchantDot"
      style={{ background: palette[index % palette.length] }}    />
    <div>
      <div className="categoryExplorerMerchant">{item.merchant}</div>
      <div className="categoryExplorerMeta">
        {item.count} transaction{item.count === 1 ? "" : "s"}
      </div>
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

          <section className="categoryExplorerCard categoryExplorerCard--wide categoryExplorerCard--trend">
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
                    <Tooltip
                      content={<MonthlyTooltip />}
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: "none" }}
                      cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                      animationDuration={0}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                      {monthlyData.map((_, index) => (
                        <Cell
                          key={`monthly-cell-${index}`}
                          fill={palette[index % palette.length]}                        />
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