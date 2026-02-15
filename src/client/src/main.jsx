import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './pages/App.jsx'

import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import MembersPage from "./pages/members.jsx";
import User from "./pages/user.jsx";
import Onboarding from "./pages/onboarding.jsx";
import VerifyEmail from "./pages/verify-email.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/community/:communityId/*" element={<App />} />
                <Route path="/community/:communityId/members" element={<MembersPage />} />
                <Route path="/user/:userId" element={<User />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="verify-email" element={<VerifyEmail />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
