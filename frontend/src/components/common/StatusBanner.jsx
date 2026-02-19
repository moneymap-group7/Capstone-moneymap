export default function StatusBanner({ type = "info", message }) {
  if (!message) return null;

  const styles = {
    info: { border: "1px solid #ddd", background: "#fafafa" },
    success: { border: "1px solid #b7e4c7", background: "#f2fbf4" },
    warning: { border: "1px solid #ffe29a", background: "#fff8e6" },
  };

  return (
    <div style={{ marginTop: 16, padding: 12, borderRadius: 8, ...styles[type] }}>
      {message}
    </div>
  );
}
