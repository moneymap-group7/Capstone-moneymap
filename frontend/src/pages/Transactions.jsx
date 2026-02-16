import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";
import { getTransactions, updateTransactionCategory } from "../services/transactionService";

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

export default function Transactions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const [saveState, setSaveState] = useState({}); 
  const [saveError, setSaveError] = useState({}); 

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrors([]);

        const res = await getTransactions();
        if (!alive) return;

        if (!res.ok) {
          const msgs = [
            "Failed to load transactions.",
            res.status ? `HTTP ${res.status}` : null,
            res.message || null,
            "Make sure you are logged in and backend is running.",
          ].filter(Boolean);

          setErrors(msgs);
          setData([]);
          return;
        }

        setData(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!alive) return;
        setErrors(["Backend not reachable. Is the server running?"]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  async function handleCategoryChange(rowView, newCategory) {
    const id = String(rowView.transactionId);

    // optimistic UI update
    setData((prev) =>
      (prev || []).map((tx) =>
        String(tx.transactionId) === id ? { ...tx, spendCategory: newCategory } : tx
      )
    );

    setSaveState((s) => ({ ...s, [id]: "saving" }));
    setSaveError((e) => ({ ...e, [id]: "" }));

    const res = await updateTransactionCategory(id, newCategory);

    if (res.ok) {
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
    setSaveError((e) => ({ ...e, [id]: res.message || "Failed to update category" }));
  }

  const rows = useMemo(() => {
    return (data || []).map((tx) => {
      const type = tx.transactionType || "—";
      const isDebit = String(type).toUpperCase() === "DEBIT";
      const transactionId = tx.transactionId != null ? String(tx.transactionId) : "";

      return {
        key: transactionId || `${tx.transactionDate}-${tx.description}-${tx.amount}`,
        transactionId,
        date: formatDate(tx.transactionDate),
        description: tx.description ?? "—",
        amount: formatMoney(tx.amount),
        type: String(type).toUpperCase(),
        category: tx.spendCategory ?? "UNCATEGORIZED",
        isDebit,
      };
    });
  }, [data]);

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28 }}>Transactions</h2>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
            View your spending and income history.
          </div>
        </div>

        <div
          style={{
            padding: "6px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 999,
            fontSize: 13,
            color: "#374151",
            background: "#fff",
          }}
          title="Count of loaded rows"
        >
          {rows.length} items
        </div>
      </div>

      {errors.length > 0 && <ErrorBox title="Error" errors={errors} />}

      <div
        style={{
          marginTop: 14,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {loading ? (
          <div style={{ padding: 16 }}>
            <Spinner />
          </div>
        ) : errors.length > 0 ? (
          <div style={{ padding: 18, color: "#6b7280" }}>Fix the errors above.</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 18, color: "#6b7280" }}>No transactions found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 860 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={styles.thLeft}>Date</th>
                  <th style={styles.thLeft}>Description</th>
                  <th style={styles.thRight}>Amount (CAD)</th>
                  <th style={styles.thLeft}>Type</th>
                  <th style={styles.thLeft}>Category</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((tx) => {
                  const state = saveState[tx.transactionId] || "idle";
                  const err = saveError[tx.transactionId] || "";

                  const rowBg = state === "saved" ? "#f0fdf4" : "#fff";

                  const selectBorder =
                    state === "error" ? "#ef4444" : state === "saved" ? "#22c55e" : "#d1d5db";

                  return (
                    <tr key={tx.key} style={{ ...styles.tr, background: rowBg }}>
                      <td style={styles.td}>{tx.date}</td>

                      <td style={{ ...styles.td, maxWidth: 420 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {tx.description}
                        </div>
                      </td>

                      <td style={{ ...styles.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: tx.isDebit ? "#b91c1c" : "#166534",
                          }}
                        >
                          {tx.isDebit ? "-" : "+"}${tx.amount}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.pill}>{tx.type}</span>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <select
                            value={tx.category}
                            disabled={!tx.transactionId || state === "saving"}
                            onChange={(e) => handleCategoryChange(tx, e.target.value)}
                            style={{ ...styles.select, borderColor: selectBorder }}
                            title={!tx.transactionId ? "Missing transactionId from backend" : "Change category"}
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
                                ...styles.badge,
                                ...(state === "saving" ? styles.badgeSaving : {}),
                                ...(state === "saved" ? styles.badgeSaved : {}),
                                ...(state === "error" ? styles.badgeError : {}),
                              }}
                              title={state === "error" ? err : ""}
                            >
                              {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Error"}
                            </span>
                          )}
                        </div>

                        {state === "error" && (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
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
    </div>
  );
}

const styles = {
  thLeft: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  thRight: {
    textAlign: "right",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  tr: {
    background: "#fff",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
    color: "#111827",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  pill: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    color: "#374151",
  },
  select: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 13,
    color: "#111827",
  },
  badge: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    whiteSpace: "nowrap",
  },
  badgeSaving: {
    borderColor: "#93c5fd",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  badgeSaved: {
    borderColor: "#86efac",
    background: "#f0fdf4",
    color: "#166534",
  },
  badgeError: {
    borderColor: "#fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
  },
};