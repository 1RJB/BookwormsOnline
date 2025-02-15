import React, { useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import Register from "./components/Register"
import Login from "./components/Login"
import Profile from "./components/Profile"
import ChangePassword from "./components/ChangePassword"
import ForgotPassword from "./components/ForgotPassword"
import ResetPassword from "./components/ResetPassword"
import TwoFactorVerification from "./components/TwoFactorVerification"
import Header from "./components/Header"
import { AuthProvider } from "./contexts/AuthContext"
import ErrorPage from "./components/ErrorPage"

const App = () => {
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Csrf/token`, {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token")
        }
        const data = await response.json()
        // Assuming the token is returned as { token: 'the_token' }
        const csrfToken = data.token

        // Set the token as a default header for all subsequent requests
        document.documentElement.style.setProperty("--csrf-token", csrfToken)
      } catch (error) {
        console.error("Could not fetch CSRF token:", error)
        // Handle unauthorized error by redirecting to login
        if (error.message.includes("Failed to fetch CSRF token")) {
          window.location.href = "/login"
        }
      }
    }

    fetchCsrfToken()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main className="container mx-auto mt-8 px-4">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-2fa" element={<TwoFactorVerification />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/*" element={<ErrorPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App