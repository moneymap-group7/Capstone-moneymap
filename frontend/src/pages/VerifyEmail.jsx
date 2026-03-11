import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-email", {
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });

      setMessage(res.data?.message || "Email verified successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Verification failed. Please try again.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Verify Email</h2>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 10 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 10 }}>
          Verification Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
          }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      <div style={{ marginTop: 14 }}>
        Back to <Link to="/login">Login</Link>
      </div>
    </div>
  );
}