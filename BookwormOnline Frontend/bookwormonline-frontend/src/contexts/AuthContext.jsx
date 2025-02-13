"use client"

import { createContext, useState, useContext, useEffect } from "react"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setUser({ token })
    }
  }, [])

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
        throw new Error("Login failed")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      setUser({ token: data.token })
      return data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/register`, {
        method: "POST",
        body: userData // Keep as FormData for file upload support
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Registration error:", errorData)
        throw new Error("Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
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