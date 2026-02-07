import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("mm_access_token");

  function handleLogout() {
    localStorage.removeItem("mm_access_token");
    localStorage.removeItem("mm_user"); 
    navigate("/login");
  }

  return (
    <nav
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        borderBottom: "1px solid #ddd",
        alignItems: "center",
      }}
    >
      <Link to="/">MoneyMap</Link>

      {!isLoggedIn && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}

      {isLoggedIn && (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/upload"></Link>
          <button
            onClick={handleLogout}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
