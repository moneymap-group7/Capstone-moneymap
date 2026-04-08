import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import "./forgot-password.css";

const API_URL = import.meta.env.VITE_API_URL;

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
  const passwordChecks = getPasswordChecks(newPassword);

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
      const status = err?.response?.status;

      if (!err?.response) {
        setError("Unable to reach the server. Please try again.");
      } else if (status === 400) {
        setError("Please enter a valid email address.");
      } else if (status === 404) {
        setError("No account was found for that email address.");
      } else if (status >= 500) {
        setError("Something went wrong while sending the reset code. Please try again later.");
      } else {
        setError("Failed to send reset code. Please try again.");
      }
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

  const pwCheck = passwordMeetsPolicy(newPassword);
    if (!pwCheck.ok) {
      setError(pwCheck.msg);
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
      const status = err?.response?.status;

      if (!err?.response) {
        setError("Unable to reach the server. Please try again.");
      } else if (status === 400) {
        setError("The reset code is invalid or expired, or the new password does not meet requirements.");
      } else if (status === 404) {
        setError("No account was found for that email address.");
      } else if (status >= 500) {
        setError("Something went wrong while resetting your password. Please try again later.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="forgotPage">
    <main className="forgotShell">
      <section className="forgotHero">
        <div className="forgotBadge">Secure account recovery</div>

        <h1 className="forgotHeroTitle">
          Reset your
          <br />
          MoneyMap access.
        </h1>

        <p className="forgotHeroText">
          Recover access securely by verifying your email and setting a new
          password. This keeps your account protected while making the reset
          process simple.
        </p>
      </section>

      <section className="forgotPanel">
        <div className="forgotCard">
          <div className="forgotHeader">
            <h1 className="forgotTitle">Forgot Password</h1>

            <p className="forgotSubtitle">
              {step === 1
                ? "Enter your email address and we'll send you a reset code."
                : "Enter the verification code and choose your new password."}
            </p>
          </div>

          {message ? <div className="forgotSuccess">{message}</div> : null}

          {error ? <div className="forgotError">{error}</div> : null}

          {step === 1 && (
            <form onSubmit={sendCode} className="forgotForm">
              <div className="forgotField">
                <label className="forgotLabel">Email Address</label>

                <div className="forgotInputWrap">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="forgotInput"
                  />
                  <Mail size={18} className="forgotInputIcon" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="forgotButton"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetPassword} className="forgotForm">
              <div className="forgotField">
                <label className="forgotLabel">Email Address</label>

                <div className="forgotInputWrap">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="forgotInput forgotInputReadonly"
                  />
                  <Mail size={18} className="forgotInputIcon" />
                </div>
              </div>

              <div className="forgotField">
                <label className="forgotLabel">Verification Code</label>

                <div className="forgotInputWrap">
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="forgotInput"
                  />
                  <ShieldCheck size={18} className="forgotInputIcon" />
                </div>
              </div>

              <div className="forgotField">
                <label className="forgotLabel">New Password</label>

                <div className="forgotInputWrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="forgotInput forgotInputPassword"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="forgotToggle"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="forgotRulesCard">
                <div className="forgotRulesTitle">
                  Your password must contain:
                </div>

                <div className="forgotRulesList">
                  <div
                    className={`forgotRuleItem ${
                      passwordChecks.length ? "active" : ""
                    }`}
                  >
                    {passwordRuleIcon(passwordChecks.length)} At least 8
                    characters
                  </div>

                  <div
                    className={`forgotRuleItem ${
                      passwordChecks.lower ? "active" : ""
                    }`}
                  >
                    {passwordRuleIcon(passwordChecks.lower)} At least 1 lowercase
                    letter (a-z)
                  </div>

                  <div
                    className={`forgotRuleItem ${
                      passwordChecks.upper ? "active" : ""
                    }`}
                  >
                    {passwordRuleIcon(passwordChecks.upper)} At least 1 uppercase
                    letter (A-Z)
                  </div>

                  <div
                    className={`forgotRuleItem ${
                      passwordChecks.number ? "active" : ""
                    }`}
                  >
                    {passwordRuleIcon(passwordChecks.number)} At least 1 number
                    (0-9)
                  </div>

                  <div
                    className={`forgotRuleItem ${
                      passwordChecks.special ? "active" : ""
                    }`}
                  >
                    {passwordRuleIcon(passwordChecks.special)} At least 1 special
                    character (e.g. !@#$%^&*)
                  </div>
                </div>
              </div>

              <div className="forgotField">
                <label className="forgotLabel">Confirm Password</label>

                <div className="forgotInputWrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="forgotInput forgotInputPassword"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="forgotToggle"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="forgotButton"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="forgotFooter">
            <Link to="/login" className="forgotFooterLink">
              Back to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  </div>
);
}
