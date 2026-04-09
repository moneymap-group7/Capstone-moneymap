import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import ErrorBox from "../components/common/ErrorBox";
import Spinner from "../components/common/Spinner";
import { getCategoryHierarchy } from "../services/analyticsService";
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

const CATEGORY_COLORS = [
  "#8b5cf6",
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#6366f1",
  "#f59e0b",
];

function withOpacity(hex, opacity = 0.55) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function renderInnerLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  payload,
}) {
  if (!payload || percent < 0.025) return null;

  const label = payload.label || name || "";
  const percentText = `${Math.round(percent * 100)}%`;

  const RADIAN = Math.PI / 180;
  const angle = -midAngle;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(angle * RADIAN);
  const y = cy + radius * Math.sin(angle * RADIAN);

  const rotate = midAngle <= 180 ? angle : angle + 180;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        style={{
          fontSize: 12,
          fontWeight: 800,
          pointerEvents: "none",
          textShadow: "0 1px 2px rgba(0,0,0,0.35)",
        }}
      >
        <tspan x="0" dy="-0.35em">
          {label}
        </tspan>
        <tspan x="0" dy="1.1em">
          {percentText}
        </tspan>
      </text>
    </g>
  );
}

function renderOuterLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  payload,
}) {
  if (!payload || percent < 0.04) return null;

  const raw = payload.label || name || "";
  const shortLabel = raw.length > 12 ? `${raw.slice(0, 12)}…` : raw;

  const RADIAN = Math.PI / 180;
  const angle = -midAngle;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const x = cx + radius * Math.cos(angle * RADIAN);
  const y = cy + radius * Math.sin(angle * RADIAN);

  const rotate = midAngle <= 180 ? angle : angle + 180;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        style={{
          fontSize: 11,
          fontWeight: 800,
          pointerEvents: "none",
          textShadow: "0 1px 2px rgba(0,0,0,0.45)",
        }}
      >
        {shortLabel}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="categoryTooltip">
      <div className="categoryTooltipTitle">{item.label}</div>
      <div className="categoryTooltipRow">
        Total: <strong>{money(item.value)}</strong>
      </div>
      {item.parentLabel ? (
        <div className="categoryTooltipRow">
          Category: <strong>{item.parentLabel}</strong>
        </div>
      ) : null}
      {typeof item.count === "number" ? (
        <div className="categoryTooltipRow">
          Transactions: <strong>{item.count}</strong>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, subtext, tone = "default" }) {
  return (
    <div className={`categoryStatCard categoryStatCard--${tone}`}>
      <div className="categoryStatLabel">{label}</div>
      <div className="categoryStatValue">{value}</div>
      <div className="categoryStatSub">{subtext}</div>
    </div>
  );
}

export default function Categories() {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => lastNDaysRange(180), []);

  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [applied, setApplied] = useState(defaultRange);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hierarchy, setHierarchy] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    loadHierarchy(applied);
  }, [applied.start, applied.end]);

  async function loadHierarchy(range) {
    try {
      setLoading(true);
      setError("");

      const data = await getCategoryHierarchy({
        start: range.start,
        end: range.end,
        childLimit: 6,
      });

      const items = Array.isArray(data.items) ? data.items : [];
      setHierarchy(items);
      setSelectedCategory((prev) => {
        if (prev && items.some((item) => item.spendCategory === prev)) return prev;
        return items[0]?.spendCategory || "";
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load category overview";
      setError(msg);
    } finally {
      setLoading(false);
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

  const innerData = hierarchy.map((item, index) => ({
    key: item.spendCategory,
    label: titleCaseCategory(item.spendCategory),
    rawCategory: item.spendCategory,
    value: Number(item.total),
    count: item.count,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const outerData = hierarchy.flatMap((item, categoryIndex) =>
    (item.children || []).map((child, childIndex) => ({
      key: `${item.spendCategory}-${child.name}-${childIndex}`,
      label: child.name,
      parentLabel: titleCaseCategory(item.spendCategory),
      rawCategory: item.spendCategory,
      value: Number(child.total),
      count: child.count,
      fill:
        childIndex === 0
          ? CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length]
          : withOpacity(CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length], 0.68),
    })),
  );

  const selectedSummary =
    hierarchy.find((item) => item.spendCategory === selectedCategory) || hierarchy[0] || null;

  const totalSpend = hierarchy.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalTransactions = hierarchy.reduce((sum, item) => sum + Number(item.count || 0), 0);

  function openExplorer(category) {
    if (!category) return;
    navigate("/categories/explorer", { state: { category } });
  }

  if (loading) {
    return (
      <div className="categoryOverviewPage">
        <div className="categoryOverviewShell">
          <div className="categoryExplorerLoadingCard">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="categoryOverviewPage">
      <div className="categoryOverviewShell">
        <div className="categoryOverviewHero">
          <div className="categoryOverviewHeroLeft">
            <div className="categoryOverviewBadge">Category insights for your transactions</div>
            <h1 className="categoryOverviewHeading">Category Overview</h1>
            <p className="categoryOverviewSubheading">
              Explore category totals and merchant-level breakdown for your selected
              transaction range.
            </p>
            <div className="categoryOverviewAppliedRange">
              Currently viewing: {applied.start} to {applied.end}
            </div>
          </div>

          <div className="categoryExplorerFilterCard categoryOverviewFilterCard">
            <div className="categoryExplorerDateField">
              <label htmlFor="overview-start">Start</label>
              <input
                id="overview-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            <div className="categoryExplorerDateField">
              <label htmlFor="overview-end">End</label>
              <input
                id="overview-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <button className="categoryExplorerApplyBtn" onClick={onApply}>
              Apply
            </button>
          </div>
        </div>

        {error ? (
          <div className="categoryExplorerErrorWrap">
            <ErrorBox title="Error" errors={[error]} />
          </div>
        ) : null}

        <div className="categoryOverviewStatsGrid">
          <StatCard
            label="Total Spend"
            value={money(totalSpend)}
            subtext="Total categorized spend in this range"
            tone="green"
          />
          <StatCard
            label="Categories"
            value={String(innerData.length)}
            subtext="Categories found in selected date range"
            tone="blue"
          />
          <StatCard
            label="Selected"
            value={titleCaseCategory(selectedSummary?.spendCategory)}
            subtext={`Transactions: ${selectedSummary?.count ?? 0}`}
            tone="purple"
          />
        </div>

        <div className="categoryOverviewChartCard">
          <div className="categoryExplorerCardHeader">
            <div>
              <h2 className="categoryExplorerCardTitle">Category Breakdown Chart</h2>
              <p className="categoryExplorerCardSub">
                Inner ring shows main categories. Outer ring shows merchant breakdown
                within each category.
              </p>
            </div>
          </div>

          {innerData.length ? (
            <>
              <div className="categoryOverviewChartWrap">
                <ResponsiveContainer width="100%" height={640}>
                  <PieChart>
                    <Pie
                      data={innerData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={95}
                      outerRadius={180}
                      paddingAngle={0.2}
                      labelLine={false}
                      label={renderInnerLabel}
                      onClick={(entry) => {
                        setSelectedCategory(entry.rawCategory);
                        openExplorer(entry.rawCategory);
                      }}
                    >
                      {innerData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.fill}
                          cursor="pointer"
                          onMouseEnter={() => setSelectedCategory(entry.rawCategory)}
                        />
                      ))}
                    </Pie>

                    <Pie
                      data={outerData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={190}
                      outerRadius={295}
                      paddingAngle={0.1}
                      labelLine={false}
                      label={renderOuterLabel}
                      onClick={(entry) => {
                        setSelectedCategory(entry.rawCategory);
                        openExplorer(entry.rawCategory);
                      }}
                    >
                      {outerData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.fill}
                          cursor="pointer"
                          onMouseEnter={() => setSelectedCategory(entry.rawCategory)}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      content={<ChartTooltip />}
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: "none" }}
                      cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="categoryOverviewBottomRow">
                <div className="categoryOverviewSelectedCard">
                  <div className="categoryOverviewSelectedLabel">Selected Category</div>
                  <div className="categoryOverviewSelectedValue">
                    {titleCaseCategory(selectedSummary?.spendCategory)}
                  </div>
                  <div className="categoryOverviewSelectedMeta">
                    Total: {money(selectedSummary?.total)} · Transactions:{" "}
                    {selectedSummary?.count ?? 0}
                  </div>
                  <div className="categoryOverviewSelectedHint">
                    Click a chart section or legend item to switch the selected category.
                  </div>
                </div>

                <div className="categoryOverviewActionArea">
                  <button
                    className="categoryExplorerApplyBtn"
                    onClick={() => openExplorer(selectedSummary?.spendCategory)}
                    disabled={!selectedSummary?.spendCategory}
                  >
                    View Detailed Breakdown
                  </button>
                </div>
              </div>

              <div className="categoryOverviewLegend">
                {innerData.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`categoryOverviewLegendItem ${
                      selectedCategory === item.rawCategory ? "is-active" : ""
                    }`}
                    onClick={() => {
                      setSelectedCategory(item.rawCategory);
                      openExplorer(item.rawCategory);
                    }}
                  >
                    <span
                      className="categoryOverviewLegendDot"
                      style={{ background: item.fill }}
                    />
                    <span className="categoryOverviewLegendText">{item.label}</span>
                    <span className="categoryOverviewLegendAmount">
                      {money(item.value)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="categoryOverviewEmptyState">
              <div className="categoryOverviewEmptyIcon">◌</div>
              <div className="categoryOverviewEmptyTitle">No category data yet</div>
              <div className="categoryOverviewEmptyText">
                No categorized transactions were found for the selected date range.
                Try widening the range or upload statement data first.
              </div>
              <div className="categoryOverviewEmptyMeta">
                Current range: {applied.start} to {applied.end}
              </div>
            </div>
          )}
        </div>

        <div className="categoryOverviewFootNote">
          Total transactions in range: {totalTransactions}
        </div>
      </div>
    </div>
  );
}