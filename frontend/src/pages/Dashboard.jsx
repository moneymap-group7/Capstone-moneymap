import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mm_user");
      if (raw) {
        const user = JSON.parse(raw);
        setName(user?.name || "");
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <p style={{ marginTop: 8 }}>
        ✅ You are logged in{ name ? `, ${name}` : "" }.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          maxWidth: 520,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Sprint 1 Placeholder</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>Protected route is working (you can see this page only with a token).</li>
          <li>Next sprint: charts + transactions + budgets.</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button
          onClick={() => navigate("/upload")}
          style={{ padding: "8px 12px", cursor: "pointer" }}
        >
          Go to Upload
        </button>
      </div>
    </main>
  );
}
