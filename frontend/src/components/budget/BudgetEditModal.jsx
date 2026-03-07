// frontend/src/components/budget/BudgetEditModal.jsx
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

function toYmd(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getToken() {
  return localStorage.getItem("mm_access_token");
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

  // Initialize inputs from existing utilization rows (if any)
  const initial = useMemo(() => {
    const map = new Map();
    for (const r of existingRows) {
      const category = r?.spendCategory ?? r?.name;
      const amount = r?.budgetLimit ?? r?.amount;
      if (category) map.set(category, Number(amount) || 0);
    }
    const obj = {};
    for (const c of CATEGORIES) obj[c] = map.get(c) ?? 0;
    return obj;
  }, [existingRows]);

  const [limits, setLimits] = useState(initial);

  useEffect(() => {
    if (open) {
      setLimits(initial);
      setError("");
    }
  }, [initial, open]);

  if (!open) return null;

  const start = toYmd(monthStart);
  const end = toYmd(monthEnd);

  const handleChange = (cat, value) => {
    const n = Number(value);
    setLimits((prev) => ({ ...prev, [cat]: Number.isFinite(n) ? n : 0 }));
  };

  const normalizeYmd = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v.slice(0, 10);
    return "";
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const token = getToken();

    const itemsToSave = Object.entries(limits)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount),
      }))
      .filter((x) => Number.isFinite(x.amount) && x.amount > 0);

    try {
      // Load existing budgets to PATCH (avoid duplicates)
      const listRes = await fetch("/api/budgets", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const existing = await listRes.json().catch(() => []);
      if (!listRes.ok) {
        throw new Error(`Failed to load budgets (${listRes.status})`);
      }

      const existingArr = Array.isArray(existing) ? existing : [];

      for (const item of itemsToSave) {
        const match = existingArr.find((b) => {
          const bCategory = b?.name ?? b?.spendCategory;
          const bStart = normalizeYmd(b?.startDate);
          return bCategory === item.category && bStart === start;
        });

        // Send BOTH fields for compatibility:
        // - Some backend DTOs expect `name`
        // - Some parts of the app use `spendCategory`
        const payload = {
          name: item.category,
          spendCategory: item.category,
          amount: item.amount,
          startDate: `${start}T00:00:00.000Z`,
          endDate: `${end}T23:59:59.999Z`,
        };

        const url = match?.budgetId ? `/api/budgets/${match.budgetId}` : "/api/budgets";
        const method = match?.budgetId ? "PATCH" : "POST";

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
      }

      onSaved?.();
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
              {start} → {end}
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
                value={limits[cat] ?? 0}
                onChange={(e) => handleChange(cat, e.target.value)}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        <div className="modalFooter">
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Budgets"}
          </button>
        </div>

        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
          Creates or updates budgets per category for the selected month.
        </div>
      </div>
    </div>
  );
}