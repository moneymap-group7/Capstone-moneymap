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
      if (r?.spendCategory) map.set(r.spendCategory, Number(r.budgetLimit) || 0);
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

  // These are the month range strings your utilization endpoint uses
  const start = toYmd(monthStart); // "YYYY-MM-DD"
  const end = toYmd(monthEnd);     // "YYYY-MM-DD"

  const handleChange = (cat, value) => {
    const n = Number(value);
    setLimits((prev) => ({ ...prev, [cat]: Number.isFinite(n) ? n : 0 }));
  };

  const normalizeYmd = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v.slice(0, 10); // ISO -> YYYY-MM-DD
    return "";
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const token = getToken();

    const itemsToSave = Object.entries(limits)
      .map(([name, amount]) => ({ name, amount: Number(amount) }))
      .filter((x) => Number.isFinite(x.amount) && x.amount > 0);

    try {
      // 1) Load existing budgets so we can PATCH instead of creating duplicates
      const listRes = await fetch("/api/budgets", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const existing = await listRes.json().catch(() => []);
      if (!listRes.ok) {
        throw new Error(`Failed to load budgets (${listRes.status})`);
      }

      const existingArr = Array.isArray(existing) ? existing : [];

      // 2) Upsert each category budget (POST if missing, PATCH if exists)
      for (const item of itemsToSave) {
        const match = existingArr.find((b) => {
          const bName = b?.name;
          const bStart = normalizeYmd(b?.startDate);
          return bName === item.name && bStart === start;
        });

        // IMPORTANT: Prisma expects ISO DateTime for DateTime fields
        const payload = {
          name: item.name,
          amount: item.amount,
          startDate: `${start}T00:00:00.000Z`,
          endDate: `${end}T23:59:59.999Z`,
        };

        if (match?.budgetId) {
          const res = await fetch(`/api/budgets/${match.budgetId}`, {
            method: "PATCH",
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
              `Update failed (${res.status})`;
            throw new Error(msg);
          }
        } else {
          const res = await fetch("/api/budgets", {
            method: "POST",
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
              `Create failed (${res.status})`;
            throw new Error(msg);
          }
        }
      }

      onSaved?.();
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