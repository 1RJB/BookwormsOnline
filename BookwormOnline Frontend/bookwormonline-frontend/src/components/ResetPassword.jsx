"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const resetToken = new URLSearchParams(location.search).get("token")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resetToken, newPassword }),
      })

      if (response.ok) {
        setSuccess("Password reset successfully")
        setTimeout(() => navigate("/login"), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to reset password")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setError("An error occurred. Please try again.")
    }
  }

  if (!resetToken) {
    return <div className="error">Invalid reset link. Please request a new password reset.</div>
  }

  return (
    <div className="reset-password">
      <h2>Reset Password</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full">
          Reset Password
        </button>
      </form>
    </div>
  )
}

export default ResetPassword