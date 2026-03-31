import { useEffect, useMemo, useState } from "react";
import "./rules.css";
import { SPEND_CATEGORY_OPTIONS } from "../components/common/spendcategories";
import {
  createRule,
  deleteRule,
  fetchRules,
  getCurrentUserId,
  updateRule,
} from "../services/ruleService";

const TRANSACTION_TYPE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "DEBIT", label: "DEBIT" },
  { value: "CREDIT", label: "CREDIT" },
];

const EMPTY_FORM = {
  isActive: true,
  priority: 100,
  merchantContains: "",
  merchantEquals: "",
  minAmount: "",
  maxAmount: "",
  transactionType: "",
  spendCategory: "OTHER",
};

function cleanNumber(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

function buildPayload(form, userId) {
  return {
    userId,
    isActive: !!form.isActive,
    priority: Number(form.priority),
    merchantContains: form.merchantContains.trim() || null,
    merchantEquals: form.merchantEquals.trim() || null,
    minAmount: cleanNumber(form.minAmount),
    maxAmount: cleanNumber(form.maxAmount),
    transactionType: form.transactionType || null,
    spendCategory: form.spendCategory,
  };
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatCategory(value) {
  if (!value) return "—";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function RuleSummaryCard({ label, value, tone = "default" }) {
  return (
    <div className={`ruleSummaryCard ruleSummaryCard--${tone}`}>
      <div className="ruleSummaryLabel">{label}</div>
      <div className="ruleSummaryValue">{value}</div>
    </div>
  );
}

export default function RulesPage() {
  const userId = useMemo(() => getCurrentUserId(), []);
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  async function loadRules() {
    if (!userId) {
      setPageError("Could not find logged-in user information.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");

    const result = await fetchRules(userId);

    if (!result.ok) {
      setPageError(result.message || "Failed to load rules.");
      setRules([]);
      setLoading(false);
      return;
    }

    setRules(Array.isArray(result.data) ? result.data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, [userId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingRuleId(null);
    setPageError("");
  }

  function startEdit(rule) {
    setEditingRuleId(rule.ruleId);
    setSuccessMessage("");
    setPageError("");
    setForm({
      isActive: !!rule.isActive,
      priority: rule.priority ?? 100,
      merchantContains: rule.merchantContains ?? "",
      merchantEquals: rule.merchantEquals ?? "",
      minAmount: rule.minAmount ?? "",
      maxAmount: rule.maxAmount ?? "",
      transactionType: rule.transactionType ?? "",
      spendCategory: rule.spendCategory ?? "OTHER",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!userId) {
      setPageError("Missing user information.");
      return;
    }

    if (!form.spendCategory) {
      setPageError("Spend category is required.");
      return;
    }

    if (
      !form.merchantContains.trim() &&
      !form.merchantEquals.trim() &&
      form.minAmount === "" &&
      form.maxAmount === "" &&
      !form.transactionType
    ) {
      setPageError("Add at least one matching condition for the rule.");
      return;
    }

    const minAmount = cleanNumber(form.minAmount);
    const maxAmount = cleanNumber(form.maxAmount);

    if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
      setPageError("Minimum amount cannot be greater than maximum amount.");
      return;
    }

    setSubmitting(true);
    setPageError("");
    setSuccessMessage("");

    const payload = buildPayload(form, userId);

    const result = editingRuleId
      ? await updateRule(editingRuleId, payload)
      : await createRule(payload);

    if (!result.ok) {
      setSubmitting(false);
      setPageError(result.message || "Failed to save rule.");
      return;
    }

    setSubmitting(false);
    setSuccessMessage(editingRuleId ? "Rule updated successfully." : "Rule created successfully.");
    resetForm();
    await loadRules();
  }

  async function handleDelete(ruleId) {
    const confirmed = window.confirm("Delete this rule?");
    if (!confirmed) return;

    setPageError("");
    setSuccessMessage("");

    const result = await deleteRule(ruleId);

    if (!result.ok) {
      setPageError(result.message || "Failed to delete rule.");
      return;
    }

    if (editingRuleId === ruleId) {
      resetForm();
    }

    setSuccessMessage("Rule deleted successfully.");
    await loadRules();
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
  }

  const activeCount = rules.filter((rule) => rule.isActive).length;
  const inactiveCount = rules.length - activeCount;

  const filteredRules = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !q ||
        String(rule.merchantContains || "").toLowerCase().includes(q) ||
        String(rule.merchantEquals || "").toLowerCase().includes(q) ||
        String(rule.spendCategory || "").toLowerCase().includes(q) ||
        String(rule.transactionType || "").toLowerCase().includes(q) ||
        String(rule.priority || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && rule.isActive) ||
        (statusFilter === "INACTIVE" && !rule.isActive);

      const matchesType =
        typeFilter === "ALL" ||
        String(rule.transactionType || "") === typeFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        String(rule.spendCategory || "") === categoryFilter;

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [rules, searchTerm, statusFilter, typeFilter, categoryFilter]);

  return (
    <div className="rulesPage">
      <div className="rulesShell">
        <section className="rulesHero">
          <div className="rulesHeroLeft">
            <span className="rulesBadge">Custom transaction categorization</span>
            <h1 className="rulesTitle">Rule Management</h1>
            <p className="rulesSub">
              Create, edit, and manage custom categorization rules. Lower priority
              numbers run first, so more specific rules should usually come earlier.
            </p>
          </div>

          <div className="rulesHeroStats">
            <RuleSummaryCard label="Total Rules" value={rules.length} tone="blue" />
            <RuleSummaryCard label="Active Rules" value={activeCount} tone="green" />
            <RuleSummaryCard label="Inactive Rules" value={inactiveCount} tone="red" />
          </div>
        </section>

        <div className="rulesGrid">
          <section className="rulesCard">
            <div className="rulesCardHeader">
              <div>
                <h2>{editingRuleId ? "Edit Rule" : "Add Rule"}</h2>
                <p>
                  Define matching conditions and choose the category to assign.
                </p>
              </div>

              <label className="rulesToggle">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                <span>Rule is active</span>
              </label>
            </div>

            {pageError ? <div className="rulesAlert error">{pageError}</div> : null}
            {successMessage ? <div className="rulesAlert success">{successMessage}</div> : null}

            <form className="rulesForm" onSubmit={handleSubmit}>
              <div className="rulesFormGrid">
                <label>
                  <span>Priority</span>
                  <input
                    type="number"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </label>

                <label>
                  <span>Transaction Type</span>
                  <select
                    name="transactionType"
                    value={form.transactionType}
                    onChange={handleChange}
                  >
                    {TRANSACTION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value || "any"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Merchant Contains</span>
                  <input
                    type="text"
                    name="merchantContains"
                    value={form.merchantContains}
                    onChange={handleChange}
                    placeholder="Example: uber"
                  />
                </label>

                <label>
                  <span>Merchant Equals</span>
                  <input
                    type="text"
                    name="merchantEquals"
                    value={form.merchantEquals}
                    onChange={handleChange}
                    placeholder="Example: TIM HORTONS"
                  />
                </label>

                <label>
                  <span>Minimum Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    name="minAmount"
                    value={form.minAmount}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </label>

                <label>
                  <span>Maximum Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    name="maxAmount"
                    value={form.maxAmount}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </label>

                <label className="rulesFormGridFull">
                  <span>Spend Category</span>
                  <select
                    name="spendCategory"
                    value={form.spendCategory}
                    onChange={handleChange}
                    required
                  >
                    {SPEND_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {formatCategory(category)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rulesHintBox">
                A rule should usually have at least one meaningful matcher such as
                merchant text, amount range, or transaction type.
              </div>

              <div className="rulesActions">
                <button type="submit" className="primaryBtn" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingRuleId
                    ? "Update Rule"
                    : "Create Rule"}
                </button>

                {editingRuleId ? (
                  <button type="button" className="secondaryBtn" onClick={resetForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rulesCard">
            <div className="rulesCardHeader">
              <div>
                <h2>Existing Rules</h2>
                <p>Review, edit, or delete saved categorization rules.</p>
              </div>
            </div>

            <div className="rulesFilterBar">
              <div className="rulesFilterGrid">
                <label className="rulesFilterField rulesFilterFieldSearch">
                  <span>Search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search merchant, category, type, or priority"
                  />
                </label>

                <label className="rulesFilterField">
                  <span>Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>

                <label className="rulesFilterField">
                  <span>Type</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </label>

                <label className="rulesFilterField">
                  <span>Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {SPEND_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {formatCategory(category)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rulesFilterActions">
                <div className="rulesFilterResults">
                  Showing <strong>{filteredRules.length}</strong> of{" "}
                  <strong>{rules.length}</strong> rules
                </div>

                <button
                  type="button"
                  className="secondaryBtn"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rulesEmptyState">
                <strong>Loading rules...</strong>
                <p>Please wait while your rules are being loaded.</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="rulesEmptyState">
                <strong>No rules found</strong>
                <p>Create your first rule to automatically categorize transactions.</p>
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="rulesEmptyState">
                <strong>No matching rules</strong>
                <p>Try changing or clearing the current search and filter values.</p>
              </div>
            ) : (
              <div className="rulesTableWrap">
                <table className="rulesTable">
                  <thead>
                    <tr>
                      <th>Active</th>
                      <th>Priority</th>
                      <th>Contains</th>
                      <th>Equals</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule) => (
                      <tr key={String(rule.ruleId)}>
                        <td>
                          <span className={rule.isActive ? "statusBadge active" : "statusBadge inactive"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{formatValue(rule.priority)}</td>
                        <td>{formatValue(rule.merchantContains)}</td>
                        <td>{formatValue(rule.merchantEquals)}</td>
                        <td>{formatValue(rule.minAmount)}</td>
                        <td>{formatValue(rule.maxAmount)}</td>
                        <td>{formatValue(rule.transactionType)}</td>
                        <td>{formatCategory(rule.spendCategory)}</td>
                        <td className="actionCell">
                          <button type="button" className="tableBtn" onClick={() => startEdit(rule)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tableBtn dangerBtn"
                            onClick={() => handleDelete(rule.ruleId)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}