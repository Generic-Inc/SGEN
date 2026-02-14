import { useState, useEffect } from "react";
import SignupOverlay from "../components/signup_overlay.jsx"

import "../static/styles/App.css";
import NavBar from "../components/nav_bar";
import SideBar from "../components/side_bar";
import FeedRouter from "../components/feed_router.jsx";
import CreatePostModal from "../components/create_post_modal";

export default function App() {
    return (
        <div className="app-container">
            <NavBar />

            <div className="main-layout">
                <SideBar />

                <main className="content-area">
                    <FeedRouter />
                </main>
            </div>

            <CreatePostModal />
        </div>
    );
}