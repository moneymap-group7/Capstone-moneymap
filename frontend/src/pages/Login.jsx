import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff, Mail } from "lucide-react";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function inputStyle(withRightIcon = false) {
  return {
    width: "100%",
    height: 48,
    padding: withRightIcon ? "0 46px 0 14px" : "0 42px 0 14px",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };
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
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 22,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
          padding: 28,
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Login
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              color: "#64748b",
            }}
          >
            Sign in to continue using MoneyMap.
          </p>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "block" }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Email
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Enter your email"
                  style={inputStyle()}
                />
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </label>

            <label style={{ display: "block" }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Password
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={inputStyle(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#475569",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            <div style={{ textAlign: "right", marginTop: -4 }}>
              <Link
                to="/forgot-password"
                style={{
                  color: "#2563eb",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: 48,
                border: "1px solid #2563eb",
                borderRadius: 12,
                background: "#2563eb",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 14,
            color: "#475569",
          }}
        >
          Don’t have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
