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

function renderInnerLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, payload }) {
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
        <tspan x="0" dy="-0.35em">{label}</tspan>
        <tspan x="0" dy="1.1em">{percentText}</tspan>
      </text>
    </g>
  );
}

function renderOuterLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, payload }) {
  if (!payload || percent < 0.01) return null;

  const raw = payload.label || name || "";
  const shortLabel = raw.length > 15 ? `${raw.slice(0, 15)}…` : raw;

  const RADIAN = Math.PI / 180;
  const angle = -midAngle;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.56;
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
          fontSize: 10,
          fontWeight: 700,
          pointerEvents: "none",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
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
        {item.label}
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        Total: <strong style={{ color: "#0f172a" }}>{money(item.value)}</strong>
      </div>
      {item.parentLabel ? (
        <div style={{ fontSize: 14, color: "#475569" }}>
          Category: <strong style={{ color: "#0f172a" }}>{item.parentLabel}</strong>
        </div>
      ) : null}
      {typeof item.count === "number" ? (
        <div style={{ fontSize: 14, color: "#475569" }}>
          Transactions: <strong style={{ color: "#0f172a" }}>{item.count}</strong>
        </div>
      ) : null}
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
      setSelectedCategory((prev) => prev || items[0]?.spendCategory || "");
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

  function openExplorer(category) {
    if (!category) return;
    navigate("/categories/explorer", { state: { category } });
  }

  if (loading) {
    return (
      <div className="categoryOverviewPage">
        <div className="categoryExplorerLoadingCard">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="categoryOverviewPage">
      <div className="categoryOverviewTopBar">
        <div>
          <h1 className="categoryExplorerTitle">Category Overview</h1>
          <p className="categoryExplorerSub">
            Explore category totals and their merchant-level breakdown.
          </p>
        </div>

        <div className="categoryExplorerFilterCard">
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

      <div className="categoryOverviewChartCard">
        <div className="categoryExplorerCardHeader">
          <h2 className="categoryExplorerCardTitle">Category Breakdown Chart</h2>
          <p className="categoryExplorerCardSub">
            Inner ring shows categories. Outer ring shows merchant breakdown inside each category.
          </p>
        </div>

        {innerData.length ? (
          <div className="categoryOverviewChartWrap">
            <ResponsiveContainer width="100%" height={700}>
              <PieChart>
                <Pie
                  data={innerData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={95}
                  outerRadius={205}
                  paddingAngle={1}
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
                  innerRadius={212}
                  outerRadius={340}
                  paddingAngle={0.6}
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

                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="categoryOverviewEmpty">
            No category data found for the selected date range.
          </div>
        )}

        <div className="categoryOverviewActions">
          <div className="categoryOverviewSelected">
            <div className="categoryOverviewSelectedLabel">Selected</div>
            <div className="categoryOverviewSelectedValue">
              {titleCaseCategory(selectedSummary?.spendCategory)}
            </div>
            <div className="categoryOverviewSelectedMeta">
              Total: {money(selectedSummary?.total)} · Transactions: {selectedSummary?.count ?? 0}
            </div>
          </div>

          <button
            className="categoryExplorerApplyBtn"
            onClick={() => openExplorer(selectedSummary?.spendCategory)}
            disabled={!selectedSummary?.spendCategory}
          >
            View Detailed Breakdown
          </button>
        </div>

        <div className="categoryOverviewLegend">
          {innerData.map((item) => (
            <button
              key={item.key}
              type="button"
              className="categoryOverviewLegendItem"
              onClick={() => {
                setSelectedCategory(item.rawCategory);
                openExplorer(item.rawCategory);
              }}
            >
              <span
                className="categoryOverviewLegendDot"
                style={{ background: item.fill }}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}