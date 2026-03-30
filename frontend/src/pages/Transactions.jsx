import { useEffect, useMemo, useState } from "react";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";
import {
  getTransactions,
  updateTransactionCategory,
  deleteTransactions,
} from "../services/transactionService";
import { Trash2 } from "lucide-react";
import "./transactions.css";

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
    <div className="transactionsStatCard">
      <div className="transactionsStatValue">{value}</div>
      <div className="transactionsStatLabel">{label}</div>
      {subtext ? (
        <div className="transactionsStatSubtext">{subtext}</div>
      ) : null}
    </div>
  );
}

export default function Transactions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const [saveState, setSaveState] = useState({});
  const [saveError, setSaveError] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          setSelectedIds([]);
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
        setSelectedIds([]);
      } catch {
        if (!alive) return;
        setErrors([
          "Backend not reachable. Is the server running on http://localhost:3000 ?",
        ]);
        setData([]);
        setMeta({ page, pageSize, total: 0, totalPages: 1 });
        setSelectedIds([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [page, pageSize, q, typeFilter, fromDate, toDate]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && deleteOpen && !deleting) {
        setDeleteOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteOpen, deleting]);

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

  function handleSelectOne(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleEditMode() {
    setEditMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedIds([]);
        setDeleteOpen(false);
      }
      return next;
    });
  }

  function openDeleteModal() {
    if (!selectedIds.length) return;
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
  }

  async function confirmDeleteSelected() {
    if (!selectedIds.length) return;

    try {
      setDeleting(true);
      setErrors([]);

      await deleteTransactions(selectedIds);

      setData((prev) =>
        prev.filter((tx) => !selectedIds.includes(String(tx.transactionId)))
      );

      setSelectedIds([]);
      setDeleteOpen(false);
    } catch (err) {
      console.error(err);
      setErrors(["Failed to delete selected transactions."]);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="transactionsPageShell">
      <div className="transactionsPageContainer">
        <section className="transactionsHero">
          <div className="transactionsHeroCard">
            <span className="transactionsBadge">Transaction history workspace</span>
            <h1 className="transactionsPageTitle">Transactions</h1>
            <p className="transactionsPageSubtitle">
              Track, search, and recategorize your spending and income history.
              Filter by description, type, and date range, then manage categories
              directly from the results list.
            </p>
          </div>

          <div className="transactionsHeroSideCard">
            <div className="transactionsHeroSideLabel">Current results</div>
            <div className="transactionsHeroSideValue">
              {meta?.total ?? rows.length}
            </div>
            <div className="transactionsHeroSideText">
              {rows.length} on this page · Page {meta?.page ?? 1} of{" "}
              {meta?.totalPages ?? 1}
            </div>
          </div>
        </section>

        <div className="transactionsStatsGrid">
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

        <div className="transactionsFilterCard">
          <div className="transactionsSectionHeader">
            <div className="transactionsCardTitle">Filters</div>
            <div className="transactionsCardSubtitle">
              Search by description, transaction type, or date range.
            </div>
          </div>

          <div className="transactionsFilterGrid">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search description..."
              className="transactionsInput"
            />

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="transactionsSelect"
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
              className="transactionsDateInput"
              title="From date"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="transactionsDateInput"
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
              className="transactionsClearButton"
              title="Clear filters"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="transactionsTableCard">
          <div className="transactionsTableHeader">
            <div>
              <div className="transactionsCardTitle">Transaction List</div>
              <div className="transactionsCardSubtitle">
                {editMode
                  ? "Edit mode is on. Select transactions to delete or change categories."
                  : "Click Edit to select transactions or change categories."}
              </div>
            </div>

            <div className="transactionsTableActions">
              <button
                onClick={toggleEditMode}
                className={
                  editMode
                    ? "transactionsEditButtonActive"
                    : "transactionsEditButton"
                }
                title={editMode ? "Exit edit mode" : "Enter edit mode"}
              >
                {editMode ? "Done" : "Edit"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="transactionsCenterBlock">
              <Spinner />
            </div>
          ) : errors.length > 0 ? (
            <div className="transactionsEmptyState">Fix the errors above.</div>
          ) : filteredRows.length === 0 ? (
            <div className="transactionsEmptyState">No transactions found.</div>
          ) : (
            <div className="transactionsTableScroll">
              <table className="transactionsTable">
                <thead>
                  <tr className="transactionsTableHeadRow">
                    {editMode && <th className="transactionsThCheckbox"></th>}
                    <th className="transactionsThLeft">Date</th>
                    <th className="transactionsThLeft">Description</th>
                    <th className="transactionsThRight">Amount (CAD)</th>
                    <th className="transactionsThLeft">Type</th>
                    <th className="transactionsThLeft">Category</th>
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
                    const isSelected = selectedIds.includes(String(tx.id));

                    return (
                      <tr
                        key={tx.id}
                        className={
                          isSelected && editMode
                            ? "transactionsTr transactionsTrSelected"
                            : "transactionsTr"
                        }
                      >
                        {editMode && (
                          <td className="transactionsTdCheckbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(String(tx.id))}
                              title="Select this transaction"
                              className="transactionsCheckbox"
                            />
                          </td>
                        )}

                        <td className="transactionsTdDate">{tx.date}</td>

                        <td className="transactionsTd" style={{ maxWidth: 460 }}>
                          <div className="transactionsDescriptionCell">
                            {tx.description}
                          </div>
                        </td>

                        <td className="transactionsTdAmount">
                          <span
                            className="transactionsAmount"
                            style={{
                              color: tx.isDebit ? "#dc2626" : "#16a34a",
                            }}
                          >
                            {tx.isDebit ? "-" : "+"}${tx.amount}
                          </span>
                        </td>

                        <td className="transactionsTd">
                          <span
                            className="transactionsTypeBadge"
                            style={getTypeBadgeStyle(tx.type)}
                          >
                            {tx.type}
                          </span>
                        </td>

                        <td className="transactionsTd">
                          <div className="transactionsCategoryCell">
                            <div
                              className="transactionsCategoryPreview"
                              style={{
                                background: categoryTone.background,
                                color: categoryTone.color,
                                border: `1px solid ${categoryTone.border}`,
                              }}
                            >
                              {getCategoryLabel(tx.category)}
                            </div>

                            {editMode && (
                              <>
                                <select
                                  value={tx.category}
                                  disabled={state === "saving"}
                                  onChange={(e) =>
                                    handleCategoryChange(tx, e.target.value)
                                  }
                                  className="transactionsCategorySelect"
                                  style={{ borderColor: selectBorder }}
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
                                    className={[
                                      "transactionsSaveBadge",
                                      state === "saving"
                                        ? "transactionsSaveBadgeSaving"
                                        : "",
                                      state === "saved"
                                        ? "transactionsSaveBadgeSaved"
                                        : "",
                                      state === "error"
                                        ? "transactionsSaveBadgeError"
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                    title={state === "error" ? err : ""}
                                  >
                                    {state === "saving"
                                      ? "Saving..."
                                      : state === "saved"
                                      ? "Saved"
                                      : "Error"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {editMode && state === "error" && (
                            <div className="transactionsErrorText">
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
        
        {editMode && selectedIds.length > 0 && (
          <div className="transactionsBulkBar">
            <div className="transactionsBulkBarText">
              {selectedIds.length} selected
            </div>

            <div className="transactionsBulkBarActions">
              <button
                onClick={openDeleteModal}
                className="transactionsBulkDeleteButton"
                title={`Delete ${selectedIds.length} selected transaction(s)`}
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="transactionsBulkSecondaryButton"
              >
                Clear selection
              </button>

              <button
                onClick={toggleEditMode}
                className="transactionsBulkDoneButton"
              >
                Done
              </button>
            </div>
          </div>
        )}
        <div className="transactionsPaginationBar">
          <div className="transactionsPaginationText">
            Page <b>{meta.page}</b> of <b>{meta.totalPages}</b> · Total{" "}
            <b>{meta.total}</b>
          </div>

          <div className="transactionsPaginationControls">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="transactionsPageSizeSelect"
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
              className="transactionsSecondaryButton"
            >
              Prev
            </button>

            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={page >= (meta.totalPages || 1) || loading}
              className="transactionsPrimaryButton"
            >
              Next
            </button>
          </div>
        </div>

        {deleteOpen ? (
          <div
            className="transactionsModalOverlay"
            onMouseDown={closeDeleteModal}
          >
            <div
              className="transactionsModalCard"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="transactionsModalHeader">
                <div>
                  <div className="transactionsModalTitle">
                    Delete Transactions
                  </div>
                  <div className="transactionsModalSub">
                    {selectedIds.length} selected
                  </div>
                </div>

                <button
                  className="transactionsModalButton"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Close
                </button>
              </div>

              <div className="transactionsModalBody">
                Are you sure you want to delete the selected transaction(s)?
              </div>

              <div className="transactionsModalActions">
                <button
                  className="transactionsModalButton"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  className="transactionsModalDeleteButton"
                  onClick={confirmDeleteSelected}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}