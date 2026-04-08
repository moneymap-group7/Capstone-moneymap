export default function CategoryDropdown({
  categories = [],
  value = "",
  onChange,
  label = "Category",
  disabled = false,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#475569",
        }}
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        style={{
          height: 46,
          minWidth: 220,
          padding: "0 14px",
          border: "1px solid #dbe3ee",
          borderRadius: 12,
          background: "#ffffff",
          color: "#0f172a",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}