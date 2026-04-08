import { useEffect, useState } from "react";
import { Mail, User, X } from "lucide-react";
import api from "../services/api";

function inputStyle(readOnly = false, withIcon = false) {
  return {
    width: "100%",
    height: 46,
    padding: withIcon ? "0 14px 0 42px" : "0 14px",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    background: readOnly ? "#f8fafc" : "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };
}

export default function EditProfileModal({
  open,
  currentName,
  currentEmail,
  onClose,
  onSaved,
}) {
  const [fullName, setFullName] = useState(currentName || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(currentName || "");
      setError("");
      setSuccess("");
      setLoading(false);
    }
  }, [open, currentName]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Full name must be at most 100 characters.");
      return;
    }

    if (trimmedName === (currentName || "").trim()) {
      setError("Please enter a different name to update.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.patch("/auth/profile", {
        fullName: trimmedName,
      });

      const updatedUser = res?.data?.user ?? res?.data;

      onSaved?.(updatedUser);
      setSuccess(res?.data?.message || "Name updated successfully.");

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        "Failed to update name.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 1200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          borderRadius: 22,
          border: "1px solid #e2e8f0",
          boxShadow: "0 22px 50px rgba(15, 23, 42, 0.18)",
          padding: 28,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Edit Profile
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                color: "#64748b",
              }}
            >
              Update your display name. Email stays read-only.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#f8fafc",
              color: "#334155",
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
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

        {success ? (
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
            {success}
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
                Full Name
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  style={inputStyle(false, true)}
                />
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: 14,
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
                Email
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={currentEmail || ""}
                  readOnly
                  style={inputStyle(true, true)}
                />
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 6,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  minWidth: 110,
                  height: 44,
                  border: "1px solid #cbd5e1",
                  borderRadius: 12,
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  minWidth: 140,
                  height: 44,
                  border: "1px solid #2563eb",
                  borderRadius: 12,
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}