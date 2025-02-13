"use client"

import { createContext, useState, useContext, useEffect } from "react"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState(null) // Store email during 2FA process

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
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();
        
        if (data.requiresTwoFactor) {
            setEmail(email);
            return { requiresTwoFactor: true };
        }

        localStorage.setItem("token", data.token);
        setUser({ token: data.token });
        setEmail(null);
        return data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

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

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    setEmail(null)
    window.location.href = "/login"
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