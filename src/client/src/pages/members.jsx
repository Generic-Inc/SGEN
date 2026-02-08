import '../static/styles/App.css'
import SignupOverlay from "../components/signup_overlay.jsx"
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import Members from "../components/members.jsx";

export default function MembersPage() {

    return (
        <>
            <NavBar />
            <main>
                <SideBar />
                <div className="main-container">
                    <Members />
                </div>
            </main>
        </>
    )
}
