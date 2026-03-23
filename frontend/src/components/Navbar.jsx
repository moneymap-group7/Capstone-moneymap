import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  KeyRound,
  LogOut,
  Pencil,
  UserCircle2,
} from "lucide-react";
import api from "../services/api";
import ChangePasswordModal from "./ChangePasswordModal";
import EditProfileModal from "./EditProfileModal";
import "./navbar.css";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("mm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("mm_access_token");

  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [user, setUser] = useState(getStoredUser());

  const menuRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setUser(null);
      return;
    }

    const storedUser = getStoredUser();
    setUser(storedUser);

    const shouldFetchProfile =
      !storedUser || !storedUser.fullName || !storedUser.email;

    if (!shouldFetchProfile) return;

    let ignore = false;

    async function loadMe() {
      try {
        const res = await api.get("/auth/me");
        const profile = res?.data;

        const nextUser = {
          userId: String(profile?.userId ?? ""),
          fullName: profile?.fullName ?? "",
          email: profile?.email ?? "",
        };

        if (!ignore) {
          setUser(nextUser);
          localStorage.setItem("mm_user", JSON.stringify(nextUser));
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }

    loadMe();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("mm_access_token");
    localStorage.removeItem("mm_user");
    setMenuOpen(false);
    navigate("/login");
  }

  function openChangePassword() {
    setMenuOpen(false);
    setShowChangePassword(true);
  }

  function openEditProfile() {
    setMenuOpen(false);
    setShowEditProfile(true);
  }

  function handleProfileUpdated(updatedUser) {
    const nextUser = {
      userId: String(updatedUser?.userId ?? user?.userId ?? ""),
      fullName: updatedUser?.fullName ?? user?.fullName ?? "",
      email: updatedUser?.email ?? user?.email ?? "",
    };

    setUser(nextUser);
    localStorage.setItem("mm_user", JSON.stringify(nextUser));
  }

  const displayName = user?.fullName || "My Profile";
  const displayEmail = user?.email || "Signed in";

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbarLogo">
          MoneyMap
        </Link>

        {!isLoggedIn && (
          <div className="navbarLinks">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}

        {isLoggedIn && (
          <>
            <div className="navbarLinks">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/budget">Budgets</Link>
              <Link to="/insights">Insights</Link>
              <Link to="/insights-visuals">Visuals</Link>
              <Link to="/rules">Rules</Link>
              <Link to="/categories">Categories</Link>
            </div>

            <div className="profileMenuWrap" ref={menuRef}>
              <button
                type="button"
                className="profileTrigger"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="profileAvatarIcon">
                  <UserCircle2 size={18} />
                </span>

                <span className="profileTriggerText">
                  <span className="profileTriggerLabel">Profile</span>
                </span>

                <ChevronDown size={16} className="profileChevron" />
              </button>

              {menuOpen && (
                <div className="profileDropdown" role="menu">
                  <div className="profileDropdownHeader">
                    <div className="profileDropdownIcon">
                      <UserCircle2 size={22} />
                    </div>

                    <div className="profileDropdownIdentity">
                      <div className="profileName">{displayName}</div>
                      <div className="profileEmail">{displayEmail}</div>
                    </div>
                  </div>

                  <div className="profileDropdownDivider" />

                  <button
                    type="button"
                    className="profileDropdownItem"
                    onClick={openEditProfile}
                  >
                    <Pencil size={16} />
                    <span>Edit Name</span>
                  </button>

                  <button
                    type="button"
                    className="profileDropdownItem"
                    onClick={openChangePassword}
                  >
                    <KeyRound size={16} />
                    <span>Change Password</span>
                  </button>

                  <button
                    type="button"
                    className="profileDropdownItem profileDropdownItemDanger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <EditProfileModal
        open={showEditProfile}
        currentName={user?.fullName || ""}
        currentEmail={user?.email || ""}
        onClose={() => setShowEditProfile(false)}
        onSaved={handleProfileUpdated}
      />

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  );
}