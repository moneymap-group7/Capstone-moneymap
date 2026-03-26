import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import "./register.css";

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

function getPasswordChecks(pw) {
  return {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^\w\s]/.test(pw),
  };
}

function passwordRuleIcon(active) {
  return active ? "✓" : "○";
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordChecks = getPasswordChecks(form.password);

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
      e.name = "Full name must be 2-100 characters.";
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
        setServerError("Unable to reach the server. Please try again.");
      } else if (status === 409) {
        setServerError("An account with this email already exists.");
      } else if (status === 400) {
        setServerError("Please check your entered information and try again.");
      } else if (status >= 500) {
        setServerError(
          "Something went wrong while creating your account. Please try again later."
        );
      } else {
        setServerError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

      return (
    <div className="registerPage">
      <div className="registerShell">
        <section className="registerHero">
          <div className="registerBadge">Personal finance, made clearer</div>

          <h1 className="registerHeroTitle">
            Start tracking your money with confidence.
          </h1>

          <p className="registerHeroText">
            Create your MoneyMap account to upload statements, organize
            transactions, set budgets, and explore your spending insights in one
            place.
          </p>
        </section>

        <div className="registerCard">
          <div className="registerCardHeader">
            <h1 className="registerCardTitle">Create account</h1>
            <p className="registerCardSub">
              Register to start using MoneyMap.
            </p>
          </div>

          {serverError ? (
            <div className="registerServerError">{serverError}</div>
          ) : null}

          <form onSubmit={onSubmit} noValidate>
            <div className="registerFormGrid">
              <label className="registerField">
                <div className="registerFieldLabel">Full Name</div>

                <div className="registerInputWrap">
                  <input
                    name="name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="registerInput"
                  />
                  <User size={18} className="registerInputIcon" />
                </div>

                {errors.name ? (
                  <div className="registerFieldError">{errors.name}</div>
                ) : null}
              </label>

              <label className="registerField">
                <div className="registerFieldLabel">Email</div>

                <div className="registerInputWrap">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Enter your email"
                    className="registerInput"
                  />
                  <Mail size={18} className="registerInputIcon" />
                </div>

                {errors.email ? (
                  <div className="registerFieldError">{errors.email}</div>
                ) : null}
              </label>

              <label className="registerField">
                <div className="registerFieldLabel">Password</div>

                <div className="registerInputWrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    className="registerInput"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="registerIconButton"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password ? (
                  <div className="registerFieldError">{errors.password}</div>
                ) : null}

                <div className="registerRulesBox">
                  <div className="registerRulesTitle">
                    Your password must contain:
                  </div>

                  <div className="registerRulesList">
                    <div
                      className={`registerRuleItem ${
                        passwordChecks.length ? "isActive" : ""
                      }`}
                    >
                      <span className="registerRuleBullet">
                        {passwordRuleIcon(passwordChecks.length)}
                      </span>
                      <span>At least 8 characters</span>
                    </div>

                    <div
                      className={`registerRuleItem ${
                        passwordChecks.lower ? "isActive" : ""
                      }`}
                    >
                      <span className="registerRuleBullet">
                        {passwordRuleIcon(passwordChecks.lower)}
                      </span>
                      <span>At least 1 lowercase letter (a-z)</span>
                    </div>

                    <div
                      className={`registerRuleItem ${
                        passwordChecks.upper ? "isActive" : ""
                      }`}
                    >
                      <span className="registerRuleBullet">
                        {passwordRuleIcon(passwordChecks.upper)}
                      </span>
                      <span>At least 1 uppercase letter (A-Z)</span>
                    </div>

                    <div
                      className={`registerRuleItem ${
                        passwordChecks.number ? "isActive" : ""
                      }`}
                    >
                      <span className="registerRuleBullet">
                        {passwordRuleIcon(passwordChecks.number)}
                      </span>
                      <span>At least 1 number (0-9)</span>
                    </div>

                    <div
                      className={`registerRuleItem ${
                        passwordChecks.special ? "isActive" : ""
                      }`}
                    >
                      <span className="registerRuleBullet">
                        {passwordRuleIcon(passwordChecks.special)}
                      </span>
                      <span>
                        At least 1 special character (e.g. !@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="registerSubmitButton"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </div>
          </form>

          <div className="registerFooter">
            Already have an account?{" "}
            <Link to="/login" className="registerFooterLink">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}