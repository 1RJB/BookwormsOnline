"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    creditCardNo: "",
    mobileNo: "",
    billingAddress: "",
    shippingAddress: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const { register } = useAuth()
  const navigate = useNavigate()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!executeRecaptcha) {
      setError("reCAPTCHA not available")
      return
    }

    try {
      const reCaptchaToken = await executeRecaptcha("register")
      await register({ ...formData, reCaptchaToken })
      navigate("/login")
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again."
      setError(errorMessage)
    }
  }

  return (
    <div className="register-form">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="firstName">First Name</label>
          <input type="text" id="firstName" name="firstName" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="lastName">Last Name</label>
          <input type="text" id="lastName" name="lastName" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="creditCardNo">Credit Card Number</label>
          <input type="text" id="creditCardNo" name="creditCardNo" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="mobileNo">Mobile Number</label>
          <input type="tel" id="mobileNo" name="mobileNo" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="billingAddress">Billing Address</label>
          <input type="text" id="billingAddress" name="billingAddress" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="shippingAddress">Shipping Address</label>
          <textarea id="shippingAddress" name="shippingAddress" required onChange={handleChange}></textarea>
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required onChange={handleChange} />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  )
}

export default Register