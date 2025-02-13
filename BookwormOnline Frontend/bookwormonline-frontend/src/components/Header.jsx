import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Header = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? "nav-link active" : "nav-link"
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>📚 Bookworms Online</h1>
        </Link>
        <nav className="nav-menu">
          <ul>
            {user ? (
              <>
                <li>
                  <Link to="/profile" className={isActive("/profile")}>
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/change-password" className={isActive("/change-password")}>
                    Change Password
                  </Link>
                </li>
                <li>
                  <button onClick={logout} className="logout-button">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={isActive("/login")}>
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={isActive("/register")}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header