import { useState, useEffect } from "react";
import SignupOverlay from "../components/signup_overlay.jsx"

import "../static/styles/App.css";
import NavBar from "../components/nav_bar";
import SideBar from "../components/side_bar";
import PageRouter from "../components/page_router";
import CreatePostModal from "../components/create_post_modal";

export default function App() {
    return (
        <div className="app-container">
            <NavBar />

            <div className="main-layout">
                <SideBar />

                <main className="content-area">
                    <PageRouter />
                </main>
            </div>

            <CreatePostModal />
        </div>
    );
}