import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import Register from "./components/Register"
import Login from "./components/Login"
import Profile from "./components/Profile"
import ChangePassword from "./components/ChangePassword"
import ForgotPassword from "./components/ForgotPassword"
import ResetPassword from "./components/ResetPassword"
import TwoFactorVerification from "./components/TwoFactorVerification"
import Header from "./components/Header"
import { AuthProvider } from "./contexts/AuthContext"

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main className="container mx-auto mt-8 px-4">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-2fa" element={<TwoFactorVerification />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App