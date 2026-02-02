import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function isValidEmail(email) {
  // simple email check (backend does real validation)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordMeetsPolicy(pw) {
  // min 8 + upper + lower + digit + special
  if (pw.length < 8) return { ok: false, msg: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(pw)) return { ok: false, msg: "Password must include an uppercase letter." };
  if (!/[a-z]/.test(pw)) return { ok: false, msg: "Password must include a lowercase letter." };
  if (!/[0-9]/.test(pw)) return { ok: false, msg: "Password must include a number." };
  if (!/[^\w\s]/.test(pw)) return { ok: false, msg: "Password must include a special character." };
  return { ok: true, msg: "" };
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
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
    const password = form.password; // do not trim password

    if (!name) e.name = "Full name is required.";
    else if (name.length < 2 || name.length > 100) e.name = "Full name must be 2–100 characters.";

    if (!email) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";

    if (!password) e.password = "Password is required.";
    else {
      const pwCheck = passwordMeetsPolicy(password);
      if (!pwCheck.ok) e.password = pwCheck.msg;
    }

    return { e, payload: { name, email, password } };
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
      navigate("/login");
    } catch (err) {
      const status = err?.response?.status;

      if (!err?.response) {
        setServerError("Backend not reachable. Is the server running?");
      } else {

        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          (status === 409 ? "Email already exists." : "Registration failed. Please try again.");

        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Create account</h2>
      <p style={{ marginTop: 0, marginBottom: 16, opacity: 0.8 }}>
        Register to start using MoneyMap.
      </p>

      {serverError ? (
        <div style={{ background: "#ffe5e5", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          {serverError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <label style={{ display: "block", marginBottom: 10 }}>
          Full Name
          <input
            name="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="name"
          />
          {errors.name ? <div style={{ color: "crimson", marginTop: 6 }}>{errors.name}</div> : null}
        </label>

        <label style={{ display: "block", marginBottom: 10 }}>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="email"
            inputMode="email"
          />
          {errors.email ? <div style={{ color: "crimson", marginTop: 6 }}>{errors.email}</div> : null}
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            autoComplete="new-password"
          />
          {errors.password ? <div style={{ color: "crimson", marginTop: 6 }}>{errors.password}</div> : null}
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Min 8 chars, include upper, lower, number, and special character.
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
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: 14 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
