"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const TwoFactorVerification = () => {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [showSessionPrompt, setShowSessionPrompt] = useState(false)
  const navigate = useNavigate()
  const { verifyTwoFactor, email } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      // Attempt verification without forceLogout
      const result = await verifyTwoFactor(code, false)

      // If there's a session conflict, show a prompt
      if (result && result.sessionConflict) {
        setShowSessionPrompt(true)
        return
      }

      // Otherwise, if success
      navigate("/profile")
    } catch (err) {
      setError(err.message || "Invalid verification code. Please try again.")
    }
  }

  // Called if user decides to force logout older session
  const handleConfirmSession = async () => {
    setShowSessionPrompt(false)
    try {
      const forcedResult = await verifyTwoFactor(code, true)
      if (forcedResult && forcedResult.token) {
        navigate("/profile")
      }
    } catch (err) {
      setError(err.message || "Verification with forced logout failed. Please try again.")
    }
  }

  // If user cancels, do nothing, remain on the 2FA form
  const handleCancelSession = () => {
    setShowSessionPrompt(false)
  }

  return (
    <div className="two-factor-verification">
      <h2>Two-Factor Authentication</h2>
      <p>Please enter the verification code sent to your email: {email}.</p>
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

      {showSessionPrompt && (
        <div className="session-conflict-prompt">
          <p>Another session is active. If you continue, all sessions will be logged out. So you will have to login again if you wish to Login here. Continue?</p>
          <div style={{ marginTop: "1rem" }}>
            <button onClick={handleConfirmSession}>OK</button>
            <button onClick={handleCancelSession} style={{ marginLeft: "1rem" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TwoFactorVerification