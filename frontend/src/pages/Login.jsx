import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: normalizedEmail,
        password,
      });

      // TEMP (until backend returns JWT): treat successful response as logged-in
      localStorage.setItem("mm_access_token", "dev-session");
      navigate("/dashboard");
      return;


      // Support multiple possible backend response shapes
      const token =
        res?.data?.data?.accessToken || // contract: { success, data: { accessToken } }
        res?.data?.accessToken ||       // common: { accessToken }
        res?.data?.token ||             // sometimes: { token }
        res?.data?.data?.token;         // sometimes nested

      if (!token) {
        setError("Login succeeded but token was missing in response.");
        return;
      }


      localStorage.setItem("mm_access_token", token);

      const user = res?.data?.data?.user || res?.data?.user;
      if (user) localStorage.setItem("mm_user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      const status = err?.response?.status;

      if (!err?.response) {
        setError("Backend not reachable. Is the server running?");
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          (status === 401 ? "Invalid email or password." : "Login failed. Please try again.");

        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Login</h2>

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="current-password"
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
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 14 }}>
        Don’t have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}
