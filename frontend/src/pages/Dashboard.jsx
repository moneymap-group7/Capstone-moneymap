import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 42, marginBottom: 12 }}>Dashboard</h1>

      <p style={{ color: "#4b5563", marginBottom: 32 }}>
        Manage your finances and navigate through your tools.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link to="/upload">
          <button style={buttonStyle}>Upload Statement</button>
        </Link>

        <Link to="/transactions">
          <button style={buttonStyle}>View Transactions</button>
        </Link>

        <Link to="/categories">
          <button style={buttonStyle}>Manage Categories</button>
        </Link>
        
        <Link to="/budget">
          <button style={buttonStyle}>Manage Budgets</button>
        </Link>

        
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 20px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};