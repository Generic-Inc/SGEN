
import '../static/styles/App.css'
import SignupOverlay from "../components/signup_overlay.jsx"
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import {isInCommunity} from "../static/aside-bar.js";
import CommunityInfo from "../components/community_info.jsx";

function App() {
    if (!isInCommunity()) {
        return (
            <>
                <NavBar />
                <main>
                    <SideBar />
                    <div className="main-container"></div>
                </main>
            </>
        )
    } else {
        return (
            <>
                <NavBar />
                <main>
                    <SideBar />
                    <div className="main-container">
                        <CommunityInfo />
                    </div>
                </main>
            </>
        )
    }

}

export default App
