"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      setError("")
      try {
        if (!user?.token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const msg = await response.text()
          throw new Error(`Failed to fetch profile: ${msg}`)
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        setError("Could not load profile data.")
      }
    }

    if (user?.token) {
      fetchProfile()
    }
  }, [user])

  if (!user?.token) {
    return <div>Please log in to view your profile.</div>
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="profile">
      <h2>Profile</h2>
      <div className="profile-info">
        {profile.photoPath && (
          <img
            src={`${import.meta.env.VITE_FILE_BASE_URL}${profile.photoPath}`}
            alt="Profile"
            width="300"
            height="300"
            style={{ borderRadius: "50%" }}
          />
        )}
        <p>
          <strong>First Name:</strong> {profile.firstName}
        </p>
        <p>
          <strong>Last Name:</strong> {profile.lastName}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Mobile Number:</strong> {profile.mobileNo}
        </p>
        <p>
          <strong>Billing Address:</strong> {profile.billingAddress}
        </p>
        <p>
          <strong>Shipping Address:</strong> {profile.shippingAddress}
        </p>
      </div>
      <div className="profile-actions">
        <button onClick={() => window.location.href = "/change-password"}>
          Change Password
        </button>
        <button onClick={() => window.location.href = "/logout"}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Profile