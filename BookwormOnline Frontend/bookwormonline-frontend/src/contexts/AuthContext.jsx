"use client"

import { createContext, useState, useContext, useEffect } from "react"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setUser({ token })
      // Start session verification
      startSessionVerification()
    }
  }, [])

  // Function to verify session
  const verifySession = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return false

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/verify-session`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Session verification returned error:", errorData.error)

        if (errorData.error === "Your session has timed out. Please log in again.") {
          alert("Your session has expired. Please log in again.")
        } 
        return false
      }

      return true
    } catch (error) {
      console.error("Session verification error:", error)
      return false
    }
  }

  // Periodically verify session
  const startSessionVerification = () => {
    const intervalId = setInterval(async () => {
      const isValid = await verifySession()
      if (!isValid) {
        clearInterval(intervalId)
        logout(false) // Do not show another alert in logout()
      }
    }, 3000) // e.g., every 3 seconds

    // In case we need to clear interval on logout:
    window.sessionCheckInterval = intervalId
  }

  const login = async (email, password, reCaptchaToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, reCaptchaToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }

      const data = await response.json()

      if (data.requiresTwoFactor) {
        setEmail(email)
        return { requiresTwoFactor: true }
      }

      localStorage.setItem("token", data.token)
      setUser({ token: data.token })
      setEmail(null)
      startSessionVerification() // Start session verification after successful login
      return data
    } catch (err) {
      console.error("Login error:", err)
      throw err
    }
  }

  const verifyTwoFactor = async (code, forceLogout = false) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, forceLogout }),
      })

      // If server returns sessionConflict, handle it:
      if (response.status === 409) {
        const conflictData = await response.json()
        if (conflictData.sessionConflict) {
          // Return a custom indicator so the UI can show an OK/Cancel
          return { sessionConflict: true }
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "2FA verification failed")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      setUser({ token: data.token })
      setEmail(null)
      startSessionVerification() // Start session verification after successful 2FA
      return data
    } catch (error) {
      console.error("2FA verification error:", error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/register`, {
        method: "POST",
        body: userData
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Registration error:", errorData.error)
        throw new Error(errorData.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  // If "showAlert" is true, we can show an alert; 
  const logout = async (showAlert = true) => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      }
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      if (showAlert) {
        alert("You have been logged out.")
      }
      localStorage.removeItem("token")
      setUser(null)
      setEmail(null)
      if (window.sessionCheckInterval) {
        clearInterval(window.sessionCheckInterval)
      }
      window.location.href = "/login"
    }
  }

  return (
    <AuthContext.Provider value={{ user, email, login, register, logout, verifyTwoFactor }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}