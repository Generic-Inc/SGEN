import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './pages/App.jsx'

import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import MembersPage from "./pages/members.jsx";
import User from "./pages/user.jsx";
import Events from "./pages/events.jsx";
import EventDetail from "./pages/event-detail.jsx";
import Onboarding from "./pages/onboarding.jsx";
import VerifyEmail from "./pages/verify-email.jsx";
import CreatePostPage from "./pages/create_post.jsx";
import CreateEventEntryPage from "./pages/create-event.jsx";

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
                <Route path="/community/:communityId/events" element={<Events />} />
                <Route path="/community/:communityId/events/:eventId" element={<EventDetail />} />
                <Route path="/create/event" element={<CreateEventEntryPage />} />
                <Route path="/create/post" element={<CreatePostPage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
