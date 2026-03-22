import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import api from "../services/api";

function inputStyle() {
  return {
    width: "100%",
    height: 48,
    padding: "0 42px 0 14px",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };
}

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

      setError(Array.isArray(msg) ? msg.join(", ") : msg);
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
            Verify Email
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              color: "#64748b",
            }}
          >
            Enter the verification code sent to your email address.
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

        {message ? (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {message}
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
                  placeholder="Enter your email"
                  autoComplete="email"
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
                Verification Code
              </div>

              <div style={{ position: "relative" }}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  inputMode="numeric"
                  style={inputStyle()}
                />
                <ShieldCheck
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
              {loading ? "Verifying..." : "Verify Email"}
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
          Back to{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}