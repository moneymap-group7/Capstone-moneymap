import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff, Mail } from "lucide-react";
import "./login.css";

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

      const meRes = await api.get("/auth/me");
      const me = meRes?.data;

      const userToStore = {
        userId: String(me?.userId ?? ""),
        fullName: me?.fullName ?? "",
        email: me?.email ?? normalizedEmail,
      };

      localStorage.setItem("mm_user", JSON.stringify(userToStore));

      navigate("/dashboard");
    } catch (err) {
      const status = err?.response?.status;

      if (!err?.response) {
        setError("Unable to reach the server. Please try again.");
      } else if (status === 401) {
        setError("Invalid email or password.");
      } else if (status === 400) {
        setError("Please check your email and password and try again.");
      } else if (status >= 500) {
        setError("Something went wrong while logging in. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="loginPage">
    <main className="loginShell">
      <section className="loginHero">
        <div className="loginBadge">Secure personal finance access</div>

        <h1 className="loginHeroTitle">
          Welcome back to
          <br />
          MoneyMap.
        </h1>

        <p className="loginHeroText">
          Sign in to upload statements, review transactions, manage budgets,
          and explore your spending insights in one place.
        </p>
      </section>

      <section className="loginPanel">
        <div className="loginCard">
          <div className="loginHeader">
            <h1 className="loginTitle">Login</h1>
            <p className="loginSubtitle">
              Sign in to continue using MoneyMap.
            </p>
          </div>

          {error ? <div className="loginError">{error}</div> : null}

          <form onSubmit={handleSubmit} noValidate className="loginForm">
            <div className="loginField">
              <label className="loginLabel">Email</label>

              <div className="loginInputWrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Enter your email"
                  className="loginInput"
                />
                <Mail size={18} className="loginInputIcon" />
              </div>
            </div>

            <div className="loginField">
              <div className="loginLabelRow">
                <label className="loginLabel">Password</label>

                <Link to="/forgot-password" className="loginForgotLink">
                  Forgot password?
                </Link>
              </div>

              <div className="loginInputWrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="loginInput loginInputPassword"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="loginToggle"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="loginButton"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="loginFooter">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="loginFooterLink">
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  </div>
);
}