"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error("Failed to fetch profile", error)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  const handleLogout = () => {
    logout()
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
        <button onClick={() => (window.location.href = "/change-password")}>Change Password</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}

export default Profile

