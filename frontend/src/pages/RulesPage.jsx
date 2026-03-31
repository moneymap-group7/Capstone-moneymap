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

const EMPTY_FIELD_ERRORS = {
  priority: "",
  merchantContains: "",
  merchantEquals: "",
  minAmount: "",
  maxAmount: "",
  transactionType: "",
  spendCategory: "",
  matcherGroup: "",
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

function CategoryBadge({ value }) {
  return <span className="ruleCategoryBadge">{formatCategory(value)}</span>;
}

function MutedValue({ value }) {
  if (value === null || value === undefined || value === "") {
    return <span className="ruleMutedValue">—</span>;
  }
  return <span>{String(value)}</span>;
}

export default function RulesPage() {
  const userId = useMemo(() => getCurrentUserId(), []);
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingRuleId, setDeletingRuleId] = useState(null);

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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (deleteTarget && !deletingRuleId) {
          setDeleteTarget(null);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, deletingRuleId]);

  function validateForm(nextForm) {
    const errors = { ...EMPTY_FIELD_ERRORS };

    const priorityNum = Number(nextForm.priority);
    const minAmount = cleanNumber(nextForm.minAmount);
    const maxAmount = cleanNumber(nextForm.maxAmount);

    if (!Number.isFinite(priorityNum) || priorityNum < 1) {
      errors.priority = "Priority must be at least 1.";
    }

    if (!nextForm.spendCategory) {
      errors.spendCategory = "Spend category is required.";
    }

    const hasMatcher =
      !!nextForm.merchantContains.trim() ||
      !!nextForm.merchantEquals.trim() ||
      nextForm.minAmount !== "" ||
      nextForm.maxAmount !== "" ||
      !!nextForm.transactionType;

    if (!hasMatcher) {
      errors.matcherGroup =
        "Add at least one matching condition: merchant text, amount range, or transaction type.";
      errors.merchantContains = "Enter at least one rule condition.";
      errors.merchantEquals = "Enter at least one rule condition.";
      errors.transactionType = "Or select a transaction type.";
    }

    if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
      errors.minAmount = "Minimum amount cannot be greater than maximum amount.";
      errors.maxAmount = "Maximum amount must be greater than or equal to minimum amount.";
    }

    return errors;
  }

  function hasAnyFieldError(errors) {
    return Object.values(errors).some(Boolean);
  }

  function clearRelatedFieldError(name) {
    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "merchantContains" ||
      name === "merchantEquals" ||
      name === "transactionType" ||
      name === "minAmount" ||
      name === "maxAmount"
        ? { matcherGroup: "" }
        : {}),
    }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => {
      const nextForm = {
        ...prev,
        [name]: nextValue,
      };

      const nextErrors = validateForm(nextForm);
      setFieldErrors(nextErrors);

      return nextForm;
    });

    clearRelatedFieldError(name);
    setPageError("");
    setSuccessMessage("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setEditingRuleId(null);
    setPageError("");
  }

  function startEdit(rule) {
    const nextForm = {
      isActive: !!rule.isActive,
      priority: rule.priority ?? 100,
      merchantContains: rule.merchantContains ?? "",
      merchantEquals: rule.merchantEquals ?? "",
      minAmount: rule.minAmount ?? "",
      maxAmount: rule.maxAmount ?? "",
      transactionType: rule.transactionType ?? "",
      spendCategory: rule.spendCategory ?? "OTHER",
    };

    setEditingRuleId(rule.ruleId);
    setSuccessMessage("");
    setPageError("");
    setForm(nextForm);
    setFieldErrors(validateForm(nextForm));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!userId) {
      setPageError("Missing user information.");
      return;
    }

    const validationErrors = validateForm(form);
    setFieldErrors(validationErrors);

    if (hasAnyFieldError(validationErrors)) {
      setPageError("Please fix the highlighted form errors.");
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
    setSuccessMessage(
      editingRuleId ? "Rule updated successfully." : "Rule created successfully."
    );
    resetForm();
    await loadRules();
  }

  function openDeleteModal(rule) {
    setDeleteTarget(rule);
    setPageError("");
    setSuccessMessage("");
  }

  function closeDeleteModal() {
    if (deletingRuleId) return;
    setDeleteTarget(null);
  }

  async function confirmDeleteRule() {
    if (!deleteTarget?.ruleId) return;

    setDeletingRuleId(deleteTarget.ruleId);
    setPageError("");
    setSuccessMessage("");

    const result = await deleteRule(deleteTarget.ruleId);

    if (!result.ok) {
      setDeletingRuleId(null);
      setPageError(result.message || "Failed to delete rule.");
      return;
    }

    if (editingRuleId === deleteTarget.ruleId) {
      resetForm();
    }

    setDeletingRuleId(null);
    setDeleteTarget(null);
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
                    className={fieldErrors.priority ? "rulesInputError" : ""}
                  />
                  {fieldErrors.priority ? (
                    <div className="rulesFieldError">{fieldErrors.priority}</div>
                  ) : null}
                </label>

                <label>
                  <span>Transaction Type</span>
                  <select
                    name="transactionType"
                    value={form.transactionType}
                    onChange={handleChange}
                    className={fieldErrors.transactionType ? "rulesInputError" : ""}
                  >
                    {TRANSACTION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value || "any"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.transactionType ? (
                    <div className="rulesFieldError">{fieldErrors.transactionType}</div>
                  ) : null}
                </label>

                <label>
                  <span>Merchant Contains</span>
                  <input
                    type="text"
                    name="merchantContains"
                    value={form.merchantContains}
                    onChange={handleChange}
                    placeholder="Example: uber"
                    className={fieldErrors.merchantContains ? "rulesInputError" : ""}
                  />
                  {fieldErrors.merchantContains ? (
                    <div className="rulesFieldError">{fieldErrors.merchantContains}</div>
                  ) : null}
                </label>

                <label>
                  <span>Merchant Equals</span>
                  <input
                    type="text"
                    name="merchantEquals"
                    value={form.merchantEquals}
                    onChange={handleChange}
                    placeholder="Example: TIM HORTONS"
                    className={fieldErrors.merchantEquals ? "rulesInputError" : ""}
                  />
                  {fieldErrors.merchantEquals ? (
                    <div className="rulesFieldError">{fieldErrors.merchantEquals}</div>
                  ) : null}
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
                    className={fieldErrors.minAmount ? "rulesInputError" : ""}
                  />
                  {fieldErrors.minAmount ? (
                    <div className="rulesFieldError">{fieldErrors.minAmount}</div>
                  ) : null}
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
                    className={fieldErrors.maxAmount ? "rulesInputError" : ""}
                  />
                  {fieldErrors.maxAmount ? (
                    <div className="rulesFieldError">{fieldErrors.maxAmount}</div>
                  ) : null}
                </label>

                <label className="rulesFormGridFull">
                  <span>Spend Category</span>
                  <select
                    name="spendCategory"
                    value={form.spendCategory}
                    onChange={handleChange}
                    required
                    className={fieldErrors.spendCategory ? "rulesInputError" : ""}
                  >
                    {SPEND_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {formatCategory(category)}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.spendCategory ? (
                    <div className="rulesFieldError">{fieldErrors.spendCategory}</div>
                  ) : null}
                </label>
              </div>

              <div
                className={`rulesHintBox ${
                  fieldErrors.matcherGroup ? "rulesHintBoxError" : ""
                }`}
              >
                {fieldErrors.matcherGroup ||
                  "A rule should usually have at least one meaningful matcher such as merchant text, amount range, or transaction type."}
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
                    {filteredRules.map((rule) => {
                      const isDeleting =
                        deleteTarget?.ruleId === rule.ruleId && !!deletingRuleId;

                      return (
                        <tr key={String(rule.ruleId)}>
                          <td>
                            <span
                              className={
                                rule.isActive
                                  ? "statusBadge active"
                                  : "statusBadge inactive"
                              }
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{formatValue(rule.priority)}</td>
                          <td><MutedValue value={rule.merchantContains} /></td>
                          <td><MutedValue value={rule.merchantEquals} /></td>
                          <td><MutedValue value={rule.minAmount} /></td>
                          <td><MutedValue value={rule.maxAmount} /></td>
                          <td><MutedValue value={rule.transactionType} /></td>
                          <td>
                            <CategoryBadge value={rule.spendCategory} />
                          </td>
                          <td className="actionCell">
                            <button
                              type="button"
                              className="tableBtn"
                              onClick={() => startEdit(rule)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="tableBtn dangerBtn"
                              onClick={() => openDeleteModal(rule)}
                              disabled={!!deletingRuleId}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {deleteTarget ? (
          <div className="rulesModalOverlay" onMouseDown={closeDeleteModal}>
            <div
              className="rulesModalCard"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="rulesModalHeader">
                <div>
                  <div className="rulesModalTitle">Delete Rule</div>
                  <div className="rulesModalSub">
                    {formatCategory(deleteTarget?.spendCategory)} · Priority{" "}
                    {formatValue(deleteTarget?.priority)}
                  </div>
                </div>

                <button
                  type="button"
                  className="rulesModalClose"
                  onClick={closeDeleteModal}
                  disabled={!!deletingRuleId}
                  aria-label="Close delete modal"
                >
                  ×
                </button>
              </div>

              <div className="rulesModalBody">
                <p className="rulesModalText">
                  Are you sure you want to delete this rule?
                </p>

                <div className="rulesDeletePreview">
                  <div className="rulesDeletePreviewRow">
                    <span>Contains</span>
                    <strong>{formatValue(deleteTarget?.merchantContains)}</strong>
                  </div>
                  <div className="rulesDeletePreviewRow">
                    <span>Equals</span>
                    <strong>{formatValue(deleteTarget?.merchantEquals)}</strong>
                  </div>
                  <div className="rulesDeletePreviewRow">
                    <span>Type</span>
                    <strong>{formatValue(deleteTarget?.transactionType)}</strong>
                  </div>
                  <div className="rulesDeletePreviewRow">
                    <span>Category</span>
                    <strong>{formatCategory(deleteTarget?.spendCategory)}</strong>
                  </div>
                </div>
              </div>

              <div className="rulesModalActions">
                <button
                  type="button"
                  className="secondaryBtn"
                  onClick={closeDeleteModal}
                  disabled={!!deletingRuleId}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="tableBtn dangerBtn rulesDeleteConfirmBtn"
                  onClick={confirmDeleteRule}
                  disabled={!!deletingRuleId}
                >
                  {deletingRuleId ? "Deleting..." : "Delete Rule"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}