import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "RENT",
  "GROCERIES",
  "TRANSPORTATION",
  "ENTERTAINMENT",
  "UTILITIES",
  "SHOPPING",
  "HEALTH",
  "EDUCATION",
  "TRAVEL",
  "FEES",
  "OTHER",
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function toYmd(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getToken() {
  return localStorage.getItem("mm_access_token");
}

function normalizeYmd(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return "";
}

export default function BudgetEditModal({
  open,
  onClose,
  monthStart,
  monthEnd,
  existingRows = [],
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initial = useMemo(() => {
    const map = new Map();

    for (const r of existingRows) {
      const category = r?.spendCategory ?? r?.name;
      const amount = r?.budgetLimit ?? r?.amount;

      if (category) {
        map.set(category, Number(amount) || 0);
      }
    }

    const obj = {};
    for (const c of CATEGORIES) {
      obj[c] = map.has(c) ? String(map.get(c)) : "";
    }
    return obj;
  }, [existingRows]);

  const [limits, setLimits] = useState(initial);

  useEffect(() => {
    if (open) {
      setLimits(initial);
      setError("");
      setSaving(false);
    }
  }, [initial, open]);

  if (!open) return null;

  const start = toYmd(monthStart);
  const end = toYmd(monthEnd);

  const handleChange = (cat, value) => {
    if (value === "") {
      setLimits((prev) => ({
        ...prev,
        [cat]: "",
      }));
      return;
    }

    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;

    setLimits((prev) => ({
      ...prev,
      [cat]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const token = getToken();

    try {
      const listRes = await fetch(`${API_BASE}/budgets`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const existing = await listRes.json().catch(() => []);

      if (!listRes.ok) {
        throw new Error(`Failed to load budgets (${listRes.status})`);
      }

      const existingArr = Array.isArray(existing) ? existing : [];

      for (const category of CATEGORIES) {
        const rawAmount = Number(limits[category] ?? 0);
        const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

        const sameMonthMatch = existingArr.find((b) => {
          const bCategory = b?.spendCategory ?? b?.name;
          const bStart = normalizeYmd(b?.startDate);
          return bCategory === category && bStart === start;
        });

        const overlappingMatches = existingArr
          .filter((b) => {
            const bCategory = b?.spendCategory ?? b?.name;
            const bStart = normalizeYmd(b?.startDate);
            const bEnd = normalizeYmd(b?.endDate);

            return (
              bCategory === category &&
              bStart <= end &&
              (!bEnd || bEnd >= start)
            );
          })
          .sort((a, b) => {
            const aStart = normalizeYmd(a?.startDate);
            const bStart = normalizeYmd(b?.startDate);
            return bStart.localeCompare(aStart);
          });

        const activeMatch = sameMonthMatch || overlappingMatches[0] || null;

        if (amount <= 0) {
          if (sameMonthMatch?.budgetId) {
            const deleteRes = await fetch(
              `${API_BASE}/budgets/${sameMonthMatch.budgetId}`,
              {
                method: "DELETE",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );

            const deleteData = await deleteRes.json().catch(() => null);

            if (!deleteRes.ok) {
              const msg =
                (deleteData &&
                  typeof deleteData === "object" &&
                  deleteData.message) ||
                `DELETE failed (${deleteRes.status})`;

              throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
            }
          }

          continue;
        }
        

        const payload = {
        name: category,
        spendCategory: category,
        amount,
        startDate: `${start}T00:00:00.000Z`,
      };
        const shouldPatchExactMonth =
          sameMonthMatch &&
          normalizeYmd(sameMonthMatch.startDate) === start;

        const url = shouldPatchExactMonth
          ? `${API_BASE}/budgets/${sameMonthMatch.budgetId}`
          : `${API_BASE}/budgets`;

        const method = shouldPatchExactMonth ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (data && typeof data === "object" && data.message) ||
            `${method} failed (${res.status})`;

          throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
        }

        if (!shouldPatchExactMonth && activeMatch?.budgetId) {
          // no-op placeholder for readability:
          // backend is responsible for collapsing overlapping future rows
        }
      }

      await onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Add / Edit Budgets</div>
            <div className="modalSub">
              Selected month: {start} → {end}
            </div>
          </div>

          <button className="btn" onClick={onClose} disabled={saving}>
            Close
          </button>
        </div>

        {error ? <div className="modalError">{error}</div> : null}

        <div className="modalGrid">
          {CATEGORIES.map((cat) => (
            <div className="modalRow" key={cat}>
              <div className="modalCat">{cat}</div>
              <input
                className="modalInput"
                type="number"
                min="0"
                step="1"
                value={limits[cat] ?? ""}
                onChange={(e) => handleChange(cat, e.target.value)}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => e.target.blur()}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        <div className="modalFooter">
          <button
            className="btn btnPrimary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Budgets"}
          </button>
        </div>

        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
          Enter a value greater than 0 to create or update a budget. Each saved
          budget will automatically apply for 12 months from the selected month.
          Set a value to 0 to remove the active budget starting in this month.
        </div>
      </div>
    </div>
  );
}