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

// MUST match backend Prisma enum exactly
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

  const [saveState, setSaveState] = useState({}); // per row
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
          setErrors([
            "Failed to load transactions.",
            res.status ? `HTTP ${res.status}` : null,
            res.message || null,
          ].filter(Boolean));
          setData([]);
          return;
        }

        setData(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!alive) return;
        setErrors(["Backend not reachable."]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  async function handleCategoryChange(tx, newCategory) {
    const id = String(tx.transactionId);

    // optimistic UI update
    setData((prev) =>
      prev.map((row) =>
        String(row.transactionId) === id
          ? { ...row, spendCategory: newCategory }
          : row
      )
    );

    setSaveState((s) => ({ ...s, [id]: "saving" }));
    setSaveError((e) => ({ ...e, [id]: "" }));

    const res = await updateTransactionCategory(id, newCategory);

    if (res.ok) {
      setSaveState((s) => ({ ...s, [id]: "saved" }));
      setTimeout(() => {
        setSaveState((s) => ({ ...s, [id]: "idle" }));
      }, 800);
      return;
    }

    // revert on error
    setData((prev) =>
      prev.map((row) =>
        String(row.transactionId) === id
          ? { ...row, spendCategory: tx.spendCategory }
          : row
      )
    );

    setSaveState((s) => ({ ...s, [id]: "error" }));
    setSaveError((e) => ({ ...e, [id]: res.message || "Update failed" }));
  }

  const rows = useMemo(() => {
    return data.map((tx) => {
      const type = tx.transactionType || "—";
      const isDebit = String(type).toUpperCase() === "DEBIT";

      return {
        key: String(tx.transactionId),
        transactionId: String(tx.transactionId),
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
      <h2 style={{ marginBottom: 12 }}>Transactions</h2>

      {errors.length > 0 && <ErrorBox title="Error" errors={errors} />}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div>No transactions found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
                <th style={styles.thRight}>Amount</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Category</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const state = saveState[tx.transactionId] || "idle";

                return (
                  <tr key={tx.key}>
                    <td style={styles.td}>{tx.date}</td>
                    <td style={styles.td}>{tx.description}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <span style={{ color: tx.isDebit ? "#b91c1c" : "#166534", fontWeight: 600 }}>
                        {tx.isDebit ? "-" : "+"}${tx.amount}
                      </span>
                    </td>
                    <td style={styles.td}>{tx.type}</td>

                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <select
                          value={tx.category}
                          disabled={state === "saving"}
                          onChange={(e) =>
                            handleCategoryChange(tx, e.target.value)
                          }
                          style={styles.select}
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>

                        {state === "saving" && <span style={styles.mini}>Saving…</span>}
                        {state === "saved" && <span style={styles.mini}>Saved ✓</span>}
                        {state === "error" && (
                          <span style={{ ...styles.mini, color: "#b91c1c" }}>
                            {saveError[tx.transactionId]}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  th: {
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
  },
  thRight: {
    textAlign: "right",
    padding: 10,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
  },
  td: {
    padding: 10,
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
  },
  select: {
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 13,
  },
  mini: {
    fontSize: 12,
    color: "#374151",
  },
};