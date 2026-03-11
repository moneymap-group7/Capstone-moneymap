import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";
import {
  getTransactions,
  updateTransactionCategory,
} from "../services/transactionService";

function formatDate(value) {
  if (!value) return "—";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

const CATEGORY_OPTIONS = [
  { value: "FOOD_AND_DINING", label: "Food & Dining" },
  { value: "GROCERIES", label: "Groceries" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "HEALTH", label: "Health" },
  { value: "EDUCATION", label: "Education" },
  { value: "TRAVEL", label: "Travel" },
  { value: "FEES", label: "Fees" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "OTHER", label: "Other" },
  { value: "UNCATEGORIZED", label: "Uncategorized" },
];

function getCategoryLabel(value) {
  const match = CATEGORY_OPTIONS.find((c) => c.value === value);
  return match?.label || value || "Uncategorized";
}

function getTypeBadgeStyle(type) {
  const normalized = String(type).toUpperCase();
  if (normalized === "DEBIT") {
    return {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    };
  }
  if (normalized === "CREDIT") {
    return {
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }
  return {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
  };
}

function getCategoryTone(category) {
  switch (category) {
    case "FOOD_AND_DINING":
      return { background: "#fff7ed", color: "#c2410c", border: "#fdba74" };
    case "TRANSPORTATION":
      return { background: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" };
    case "UTILITIES":
      return { background: "#faf5ff", color: "#7e22ce", border: "#d8b4fe" };
    case "GROCERIES":
      return { background: "#f0fdf4", color: "#166534", border: "#86efac" };
    case "INCOME":
      return { background: "#ecfdf5", color: "#047857", border: "#6ee7b7" };
    case "RENT":
      return { background: "#fefce8", color: "#a16207", border: "#fde68a" };
    case "SHOPPING":
      return { background: "#fdf2f8", color: "#be185d", border: "#f9a8d4" };
    case "UNCATEGORIZED":
      return { background: "#f8fafc", color: "#475569", border: "#cbd5e1" };
    default:
      return { background: "#f8fafc", color: "#334155", border: "#cbd5e1" };
  }
}

function StatCard({ label, value, subtext }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {subtext ? <div style={styles.statSubtext}>{subtext}</div> : null}
    </div>
  );
}

export default function Transactions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const [saveState, setSaveState] = useState({});
  const [saveError, setSaveError] = useState({});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrors([]);

        const res = await getTransactions({
          page,
          pageSize,
          q: q.trim() || undefined,
          type: typeFilter === "ALL" ? undefined : typeFilter,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });

        if (!alive) return;

        if (res && res.ok === false) {
          const msgs = [
            "Failed to load transactions.",
            res.status ? `HTTP ${res.status}` : null,
            res.message || null,
            "Make sure you are logged in and backend is running.",
          ].filter(Boolean);

          setErrors(msgs);
          setData([]);
          setMeta({ page, pageSize, total: 0, totalPages: 1 });
          return;
        }

        const payloadData = res?.data ?? res ?? [];
        const payloadMeta = res?.meta ?? {
          page,
          pageSize,
          total: Array.isArray(payloadData) ? payloadData.length : 0,
          totalPages: 1,
        };

        setData(Array.isArray(payloadData) ? payloadData : []);
        setMeta(payloadMeta);
      } catch {
        if (!alive) return;
        setErrors([
          "Backend not reachable. Is the server running on http://localhost:3000 ?",
        ]);
        setData([]);
        setMeta({ page, pageSize, total: 0, totalPages: 1 });
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [page, pageSize, q, typeFilter, fromDate, toDate]);

  async function handleCategoryChange(rowView, newCategory) {
    const id = String(rowView.id);

    setData((prev) =>
      (prev || []).map((tx) =>
        String(tx.transactionId) === id
          ? { ...tx, spendCategory: newCategory }
          : tx
      )
    );

    setSaveState((s) => ({ ...s, [id]: "saving" }));
    setSaveError((e) => ({ ...e, [id]: "" }));

    const res = await updateTransactionCategory(id, newCategory);

    if (res?.ok) {
      setSaveState((s) => ({ ...s, [id]: "saved" }));
      window.setTimeout(() => {
        setSaveState((s) => ({ ...s, [id]: "idle" }));
      }, 900);
      return;
    }

    setData((prev) =>
      (prev || []).map((tx) =>
        String(tx.transactionId) === id
          ? { ...tx, spendCategory: rowView.category }
          : tx
      )
    );

    setSaveState((s) => ({ ...s, [id]: "error" }));
    setSaveError((e) => ({
      ...e,
      [id]: res?.message || "Failed to update category",
    }));
  }

  const rows = useMemo(() => {
    return (data || []).map((tx) => {
      const type = tx.transactionType || "—";
      const normalizedType = String(type).toUpperCase();
      const isDebit = normalizedType === "DEBIT";

      const id = String(
        tx.transactionId ?? `${tx.transactionDate}-${tx.description}-${tx.amount}`
      );

      return {
        id,
        date: formatDate(tx.transactionDate),
        description: tx.description ?? "—",
        amount: formatMoney(tx.amount),
        type: normalizedType,
        category: tx.spendCategory ?? "UNCATEGORIZED",
        isDebit,
      };
    });
  }, [data]);

  const filteredRows = rows;

  const debitCount = rows.filter((r) => r.type === "DEBIT").length;
  const creditCount = rows.filter((r) => r.type === "CREDIT").length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Transactions</h1>
          <p style={styles.pageSubtitle}>
            Track, search, and recategorize your spending and income history.
          </p>
        </div>

        <div style={styles.headerPill}>
          {meta?.total ?? rows.length} total · {rows.length} on this page
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          label="Total Transactions"
          value={meta?.total ?? rows.length}
          subtext="Available in results"
        />
        <StatCard
          label="Debits"
          value={debitCount}
          subtext="Shown on this page"
        />
        <StatCard
          label="Credits"
          value={creditCount}
          subtext="Shown on this page"
        />
        <StatCard
          label="Page"
          value={`${meta?.page ?? 1}/${meta?.totalPages ?? 1}`}
          subtext={`${pageSize} rows per page`}
        />
      </div>

      {errors.length > 0 && <ErrorBox title="Error" errors={errors} />}

      <div style={styles.filterCard}>
        <div style={styles.filterHeader}>
          <div>
            <div style={styles.cardTitle}>Filters</div>
            <div style={styles.cardSubtitle}>
              Search by description, transaction type, or date range.
            </div>
          </div>
        </div>

        <div style={styles.filterGrid}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search description..."
            style={{ ...styles.input, ...styles.searchInput }}
          />

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={styles.input}
            title="Type"
          >
            <option value="ALL">All types</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            style={styles.input}
            title="From date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            style={styles.input}
            title="To date"
          />

          <button
            onClick={() => {
              setQ("");
              setTypeFilter("ALL");
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
            style={styles.clearButton}
            title="Clear filters"
          >
            Clear
          </button>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <div style={styles.cardTitle}>Transaction List</div>
            <div style={styles.cardSubtitle}>
              Inline category editing is enabled for each transaction.
            </div>
          </div>
        </div>

        {loading ? (
          <div style={styles.centerBlock}>
            <Spinner />
          </div>
        ) : errors.length > 0 ? (
          <div style={styles.emptyState}>Fix the errors above.</div>
        ) : filteredRows.length === 0 ? (
          <div style={styles.emptyState}>No transactions found.</div>
        ) : (
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.thLeft}>Date</th>
                  <th style={styles.thLeft}>Description</th>
                  <th style={styles.thRight}>Amount (CAD)</th>
                  <th style={styles.thLeft}>Type</th>
                  <th style={styles.thLeft}>Category</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((tx) => {
                  const state = saveState[tx.id] || "idle";
                  const err = saveError[tx.id] || "";

                  const selectBorder =
                    state === "error"
                      ? "#ef4444"
                      : state === "saved"
                      ? "#22c55e"
                      : "#d1d5db";

                  const categoryTone = getCategoryTone(tx.category);

                  return (
                    <tr key={tx.id} style={styles.tr}>
                      <td style={styles.tdDate}>{tx.date}</td>

                      <td style={{ ...styles.td, maxWidth: 460 }}>
                        <div style={styles.descriptionCell}>{tx.description}</div>
                      </td>

                      <td style={styles.tdAmount}>
                        <span
                          style={{
                            ...styles.amount,
                            color: tx.isDebit ? "#dc2626" : "#16a34a",
                          }}
                        >
                          {tx.isDebit ? "-" : "+"}${tx.amount}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.typeBadge,
                            ...getTypeBadgeStyle(tx.type),
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.categoryCell}>
                          <div
                            style={{
                              ...styles.categoryPreview,
                              background: categoryTone.background,
                              color: categoryTone.color,
                              border: `1px solid ${categoryTone.border}`,
                            }}
                          >
                            {getCategoryLabel(tx.category)}
                          </div>

                          <select
                            value={tx.category}
                            disabled={state === "saving"}
                            onChange={(e) =>
                              handleCategoryChange(tx, e.target.value)
                            }
                            style={{
                              ...styles.categorySelect,
                              borderColor: selectBorder,
                            }}
                            title="Change category"
                          >
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>

                          {state !== "idle" && (
                            <span
                              style={{
                                ...styles.saveBadge,
                                ...(state === "saving"
                                  ? styles.saveBadgeSaving
                                  : {}),
                                ...(state === "saved"
                                  ? styles.saveBadgeSaved
                                  : {}),
                                ...(state === "error"
                                  ? styles.saveBadgeError
                                  : {}),
                              }}
                              title={state === "error" ? err : ""}
                            >
                              {state === "saving"
                                ? "Saving..."
                                : state === "saved"
                                ? "Saved"
                                : "Error"}
                            </span>
                          )}
                        </div>

                        {state === "error" && (
                          <div style={styles.errorText}>
                            {err || "Update failed"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.paginationBar}>
        <div style={styles.paginationText}>
          Page <b>{meta.page}</b> of <b>{meta.totalPages}</b> · Total{" "}
          <b>{meta.total}</b>
        </div>

        <div style={styles.paginationControls}>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={styles.paginationSelect}
            title="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            style={{
              ...styles.secondaryButton,
              opacity: page <= 1 || loading ? 0.55 : 1,
              cursor: page <= 1 || loading ? "not-allowed" : "pointer",
            }}
          >
            Prev
          </button>

          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
            disabled={page >= (meta.totalPages || 1) || loading}
            style={{
              ...styles.primaryButton,
              opacity: page >= (meta.totalPages || 1) || loading ? 0.55 : 1,
              cursor:
                page >= (meta.totalPages || 1) || loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: "24px 24px 40px",
    background: "#f8fafc",
    minHeight: "100vh",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  pageTitle: {
    margin: 0,
    fontSize: 36,
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  pageSubtitle: {
    margin: "8px 0 0",
    fontSize: 15,
    color: "#64748b",
  },
  headerPill: {
    alignSelf: "center",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#334155",
    fontSize: 13,
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: "18px 18px 16px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1,
  },
  statLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  statSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },

  filterCard: {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    marginBottom: 18,
    boxSizing: "border-box",
  },
  filterHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 2fr) repeat(3, minmax(140px, 1fr)) auto",
    gap: 12,
    alignItems: "center",
  },
  input: {
    height: 46,
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 14,
    padding: "0 14px",
    outline: "none",
    boxSizing: "border-box",
  },
  searchInput: {
    minWidth: 220,
  },
  clearButton: {
    height: 46,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tableCard: {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.06)",
    boxSizing: "border-box",
  },

  tableHeader: {
    padding: "18px 18px 14px",
    borderBottom: "1px solid #eef2f7",
    background: "#ffffff",
  },
  centerBlock: {
    padding: 30,
  },
  emptyState: {
    padding: 24,
    color: "#64748b",
    fontSize: 14,
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 980,
  },
  tableHeadRow: {
    background: "#f8fafc",
  },
  thLeft: {
    textAlign: "left",
    padding: "14px 18px",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  thRight: {
    textAlign: "right",
    padding: "14px 18px",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  tr: {
    background: "#ffffff",
  },
  td: {
    padding: "16px 18px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    color: "#0f172a",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tdDate: {
    padding: "16px 18px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    color: "#334155",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    fontWeight: 600,
  },
  tdAmount: {
    padding: "16px 18px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    textAlign: "right",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  descriptionCell: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#0f172a",
    fontWeight: 500,
  },
  amount: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "-0.01em",
  },

  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },

  categoryCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "nowrap",
  },

  categoryPreview: {
    width: 130,
    minWidth: 130,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  },

  categorySelect: {
    width: 190,
    minWidth: 190,
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },

  saveBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#374151",
    whiteSpace: "nowrap",
  },
  saveBadgeSaving: {
    borderColor: "#bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  saveBadgeSaved: {
    borderColor: "#86efac",
    background: "#f0fdf4",
    color: "#166534",
  },
  saveBadgeError: {
    borderColor: "#fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#b91c1c",
  },

  paginationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 18,
    padding: "0 4px",
  },
  paginationText: {
    color: "#64748b",
    fontSize: 14,
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  paginationSelect: {
    height: 44,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 14,
  },
  secondaryButton: {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 700,
  },
  primaryButton: {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
  },
};