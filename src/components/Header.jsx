import "./Header.css";
import { NavLink, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  async function logout() {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      try {
        await fetch("/api/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
      } catch (e) {
        console.error("Logout backend error:", e);
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  }

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-logo">P</span>
        <span className="brand-name">PropSure</span>
      </div>

      <nav className="app-nav">
        <NavLink
          to="/cases"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Cases
        </NavLink>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Upload
        </NavLink>

        <button className="nav-link logout-btn" onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
}
