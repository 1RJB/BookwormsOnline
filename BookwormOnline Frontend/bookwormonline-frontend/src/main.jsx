import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' 
import './index.css'
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleReCaptchaProvider reCaptchaKey="6Lcc8dIqAAAAAOQ5V3Z1Vx_nFZz2s7RVRfZ5Ijje">
    <App />
  </GoogleReCaptchaProvider>
);
