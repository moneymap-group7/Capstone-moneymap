import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";
import { getTransactionsMock } from "../services/transactionService";

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

export default function Transactions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrors([]);

        // ✅ MOCK FETCH (no backend needed)
        const items = await getTransactionsMock({ delayMs: 500 });
        if (!alive) return;

        setData(items);
      } catch (e) {
        if (!alive) return;
        setErrors(["Failed to load transactions (mock)."]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    return (data || []).map((tx) => {
      const type = tx.transactionType || "—";
      const isDebit = String(type).toUpperCase() === "DEBIT";

      return {
        id: tx.transactionId ?? `${tx.transactionDate}-${tx.description}-${tx.amount}`,
        date: formatDate(tx.transactionDate),
        description: tx.description ?? "—",
        amount: formatMoney(tx.amount),
        type: String(type).toUpperCase(),
        category: tx.spendCategory ?? "—",
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

      {/* ✅ show error only if errors exist */}
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
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 760 }}>
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
                {rows.map((tx) => (
                  <tr key={tx.id} style={styles.tr}>
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
                      <span style={{ ...styles.pill, background: "#f3f4f6" }}>{tx.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Optional note for reviewers */}
      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
        Note: Transactions are currently mocked until Rudra’s Fetch API is merged.
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
};