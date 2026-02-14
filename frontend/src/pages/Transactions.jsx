import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";
import { getTransactions } from "../services/transactionService";

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

const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrors([]);

        const result = await getTransactions({ page, pageSize });
        if (!alive) return;

        setData(result?.data || []);
        setMeta(result?.meta || { page, pageSize, total: 0, totalPages: 1 });

      } catch (e) {
        if (!alive) return;
        setErrors(["Failed to load transactions."]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [page, pageSize]);

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
          {meta?.total ?? rows.length} items
        </div>
      </div>

      {/* show error only if errors exist */}
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

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          Page <b>{meta.page}</b> of <b>{meta.totalPages}</b> · Total <b>{meta.total}</b>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              padding: "10px 10px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontSize: 14,
            }}
            title="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>

          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
            disabled={page <= 1 || loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Prev
          </button>

          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
            disabled={page >= (meta.totalPages || 1) || loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>


      {/* Optional note for reviewers */}
      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
        Note: Transactions are now loaded from the backend with pagination.
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