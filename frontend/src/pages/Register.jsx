import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff, Mail, User } from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordMeetsPolicy(pw) {
  if (pw.length < 8) {
    return { ok: false, msg: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(pw)) {
    return { ok: false, msg: "Password must include an uppercase letter." };
  }
  if (!/[a-z]/.test(pw)) {
    return { ok: false, msg: "Password must include a lowercase letter." };
  }
  if (!/[0-9]/.test(pw)) {
    return { ok: false, msg: "Password must include a number." };
  }
  if (!/[^\w\s]/.test(pw)) {
    return { ok: false, msg: "Password must include a special character." };
  }
  return { ok: true, msg: "" };
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

function fieldErrorStyle() {
  return {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 6,
    fontWeight: 500,
  };
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  }

  function validateAll() {
    const e = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!name) {
      e.name = "Full name is required.";
    } else if (name.length < 2 || name.length > 100) {
      e.name = "Full name must be 2–100 characters.";
    }

    if (!email) {
      e.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      e.email = "Enter a valid email address.";
    }

    if (!password) {
      e.password = "Password is required.";
    } else {
      const pwCheck = passwordMeetsPolicy(password);
      if (!pwCheck.ok) e.password = pwCheck.msg;
    }

    return { e, payload: { fullName: name, email, password } };
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError("");

    const { e, payload } = validateAll();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", payload);

      navigate("/verify-email", {
        state: { email: payload.email },
      });
    } catch (err) {
      const status = err?.response?.status;

      if (!err?.response) {
        setServerError("Backend not reachable. Is the server running?");
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          (status === 409
            ? "Email already exists."
            : "Registration failed. Please try again.");

        setServerError(Array.isArray(msg) ? msg.join(", ") : msg);
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
            Create account
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              color: "#64748b",
            }}
          >
            Register to start using MoneyMap.
          </p>
        </div>

        {serverError ? (
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
            {serverError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate>
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
                Full Name
              </div>

              <div style={{ position: "relative" }}>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  style={inputStyle()}
                />
                <User
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

              {errors.name ? (
                <div style={fieldErrorStyle()}>{errors.name}</div>
              ) : null}
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
                Email
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
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

              {errors.email ? (
                <div style={fieldErrorStyle()}>{errors.email}</div>
              ) : null}
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
                  name="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  autoComplete="new-password"
                  placeholder="Create a password"
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

              {errors.password ? (
                <div style={fieldErrorStyle()}>{errors.password}</div>
              ) : null}

              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                Min 8 chars, include upper, lower, number, and special character.
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
              {loading ? "Creating..." : "Create account"}
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
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}