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
        // If session verification fails, log out the user
        const errorData = await response.json()
        console.error("Session verification failed:", errorData.error)
        setError(errorData.error || "Session verification failed")
        return false
      }

      return true
    } catch (error) {
      console.error("Session verification error:", error)
      setError(error || "Session verification failed")
      return false
    }
  }

  // Function to start periodic session verification
  const startSessionVerification = () => {
    // Verify session every minute
    const intervalId = setInterval(async () => {
      const isValid = await verifySession()
      if (!isValid) {
        clearInterval(intervalId)
        // Show session expired message
        alert(error || "Your session has expired or another session is active. Please log in again.")
        if (error == "Another session is active. Logout from the other session to continue.") {
          startSessionVerification() // Restart session verification
        } else {
          logout()
        }
      }
    }, 3000) // Check every 3 seconds

    // Store interval ID to clear it on logout
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
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const verifyTwoFactor = async (code) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      if (!response.ok) {
        throw new Error("2FA verification failed")
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

  const logout = async () => {
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
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("token")
      setUser(null)
      setEmail(null)
      // Clear session verification interval
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