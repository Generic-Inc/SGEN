import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './pages/App.jsx'

import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import MembersPage from "./pages/members.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/community/:communityName/*" element={<App />} />
                <Route path="/community/:communityId/members" element={<MembersPage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
