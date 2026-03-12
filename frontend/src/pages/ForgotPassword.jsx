import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Mail, ShieldCheck, Lock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function inputBaseStyle(hasIconRight = false) {
  return {
    width: "100%",
    height: 48,
    padding: hasIconRight ? "0 44px 0 14px" : "0 14px",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password/request`, {
        email,
      });

      setMessage(res.data.message || "Reset code sent.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password/reset`, {
        email,
        code,
        newPassword,
      });

      setMessage(res.data.message || "Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
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
            Forgot Password
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              color: "#64748b",
            }}
          >
            {step === 1
              ? "Enter your email address and we’ll send you a reset code."
              : "Enter the verification code and choose your new password."}
          </p>
        </div>

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

        {step === 1 && (
          <form onSubmit={sendCode}>
            <label
              style={{
                display: "block",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Email Address
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={inputBaseStyle()}
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
              }}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword}>
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
                  Email Address
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    style={{
                      ...inputBaseStyle(),
                      background: "#f8fafc",
                      color: "#475569",
                    }}
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
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    style={inputBaseStyle()}
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

              <label style={{ display: "block" }}>
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  New Password
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={inputBaseStyle(true)}
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

              <label style={{ display: "block" }}>
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Confirm Password
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={inputBaseStyle(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
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
                    title={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
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
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
