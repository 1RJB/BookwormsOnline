"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!executeRecaptcha) {
      setError("reCAPTCHA not available")
      return
    }

    try {
      const reCaptchaToken = await executeRecaptcha("login")
      const result = await login(email, password, reCaptchaToken)

      if (result.requiresTwoFactor) {
        navigate("/verify-2fa")
      } else {
        navigate("/profile")
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.")
    }
  }

  return (
    <div className="login-form">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <div className="forgot-password">
        <a href="/forgot-password">Forgot Password?</a>
      </div>
    </div>
  )
}

export default Login