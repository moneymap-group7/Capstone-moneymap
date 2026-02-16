export default function CategoryDropdown({
  categories = [],
  value = "",
  onChange,
  label = "Category",
  disabled = false,
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: "block", marginBottom: 8 }}>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        style={{ padding: 10, width: 320, borderRadius: 6 }}
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
