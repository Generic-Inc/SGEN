import '../static/styles/App.css'
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import {isInCommunity} from "../static/aside-bar.js";
import CommunityInfo from "../components/community_info.jsx";
import FeedRouter from "../components/feed_router.jsx";
import CreatePostModal from "../components/create_post_modal.jsx";
import CreateCommunity from "../components/create_community.jsx";
import ChatbotWidget from "../components/chatbot_widget.jsx";

function App() {
    if (!isInCommunity()) {
        return (
            <>
                <NavBar />
                <CreatePostModal />
                <CreateCommunity />
                <main>
                    <SideBar />
                    <div className="main-container">
                        <FeedRouter />
                    </div>
                </main>
                <ChatbotWidget />
            </>
        )
    } else {
        return (
            <>
                <NavBar />
                <CreatePostModal />
                <CreateCommunity />
                <main>
                    <SideBar />
                    <div className="main-container">
                        <CommunityInfo />
                    </div>
                </main>
                <ChatbotWidget />
            </>
        )
    }

}

export default App
