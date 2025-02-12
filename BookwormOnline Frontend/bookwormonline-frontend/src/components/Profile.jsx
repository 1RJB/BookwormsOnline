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
        const response = await fetch("https://localhost:7177/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          credentials: "include",
        })
        if (!response.ok) {
          const msg = await response.text()
          throw new Error(`Failed to fetch profile: ${msg}`)
        }
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error("Failed to fetch profile", err)
        setError("Could not load profile data.")
      }
    }

    if (user?.token) {
      fetchProfile()
    }
  }, [user])

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="profile">
      <h2>Profile</h2>
      <div className="profile-info">
        <p>
          <strong>Name:</strong> {profile.firstName} {profile.lastName}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Mobile:</strong> {profile.mobileNo}
        </p>
        <p>
          <strong>Billing Address:</strong> {profile.billingAddress}
        </p>
        <p>
          <strong>Shipping Address:</strong> {profile.shippingAddress}
        </p>
      </div>
      <div className="profile-actions">
        <button onClick={() => (window.location.href = "/change-password")}>
          Change Password
        </button>
        <button onClick={() => (window.location.href = "/logout")}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Profile