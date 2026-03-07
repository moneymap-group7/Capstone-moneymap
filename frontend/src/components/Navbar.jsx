import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";


export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("mm_access_token");

  function handleLogout() {
    localStorage.removeItem("mm_access_token");
<<<<<<< HEAD
    localStorage.removeItem("mm_user");
=======
    localStorage.removeItem("mm_user"); 
>>>>>>> origin/main
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
<<<<<<< HEAD
        </div>
=======
           <Link to="/categories">Categories</Link>
        </>
>>>>>>> origin/main
      )}

      {isLoggedIn && (
        <>
<<<<<<< HEAD
          <div className="navbarLinks">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/budget">Budgets</Link>
            <Link to="/insights">Insights</Link>
            <Link to="/rules">Rules</Link>
          </div>

          <button className="logoutBtn" onClick={handleLogout}>
=======
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
>>>>>>> origin/main
            Logout
          </button>
        </>
      )}
    </nav>
  );
}