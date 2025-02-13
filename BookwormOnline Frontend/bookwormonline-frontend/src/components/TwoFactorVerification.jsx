"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const TwoFactorVerification = () => {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { verifyTwoFactor, email } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      await verifyTwoFactor(code)
      navigate("/profile")
    } catch (err) {
      setError("Invalid verification code. Please try again.")
    }
  }

  return (
    <div className="two-factor-verification">
      <h2>Two-Factor Authentication</h2>
      <p>Please enter the verification code sent to your email.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="code">Verification Code</label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength="6"
            pattern="\d{6}"
            placeholder="Enter 6-digit code"
          />
        </div>
        <button type="submit">Verify</button>
      </form>
    </div>
  )
}

export default TwoFactorVerification