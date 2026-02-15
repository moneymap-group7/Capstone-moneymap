export default function ErrorBox({ title = "Error", errors = [] }) {
  if (!errors?.length) return null;

  return (
    <div style={{ marginTop: 16, border: "1px solid #f2b8b8", background: "#fff5f5", padding: 12, borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
