import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff } from "lucide-react";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

      const token =
        res?.data?.accessToken ||
        res?.data?.data?.accessToken ||
        res?.data?.token ||
        res?.data?.data?.token;

      if (!token) {
        setError("Login succeeded but token was missing in response.");
        return;
      }

      localStorage.setItem("mm_access_token", token);

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.sub || payload.userId || payload.id;

        if (userId) {
          localStorage.setItem("mm_user", JSON.stringify({ userId }));
        }
      } catch (e) {
        console.error("Failed to decode token", e);
      }

      navigate("/dashboard");
    } catch (err) {
      const status = err?.response?.status;

      if (!err?.response) {
        setError("Backend not reachable. Is the server running?");
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          (status === 401
            ? "Invalid email or password."
            : "Login failed. Please try again.");

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
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              boxSizing: "border-box",
            }}
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Password
          <div style={{ position: "relative", marginTop: 6 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 42px 10px 10px",
                boxSizing: "border-box",
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
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

      <div style={{ marginTop: 14, textAlign: "right" }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>

      <div style={{ marginTop: 14 }}>
        Don’t have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}