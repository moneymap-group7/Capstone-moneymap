import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("mm_access_token");

  function handleLogout() {
    localStorage.removeItem("mm_access_token");
    localStorage.removeItem("mm_user");
    navigate("/login");
  }

  return (
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
          </div>

          <button className="logoutBtn" onClick={handleLogout}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}