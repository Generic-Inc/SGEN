import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import Feed from "../components/feed.jsx";
import UserProfile from "../components/user_profile.jsx"; // IMPORT THIS
import CreatePostModal from "../components/create_post_modal.jsx";
import "../static/styles/feed_override.css";

import { useAuth } from "../hooks/useAuth";
import { useCurrentView } from "../hooks/useCurrentView";

function App() {
  const { user, loading } = useAuth();
  const currentView = useCurrentView();

  return (
    <>
        <NavBar user={user} />

        <main className="app-main">
            <SideBar />

            <div className="main-container">
                {loading ? (
                    <div style={{textAlign: "center"}}>Loading...</div>
                ) : user ? (
                    currentView.type === 'user' ? (
                        <UserProfile userId={currentView.id} />
                    ) : (
                        <Feed user={user} view={currentView} />
                    )
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                        <h2>Welcome to SGEN</h2>
                        <p>Please log in to view the community feed.</p>
                    </div>
                )}
            </div>
        </main>

        <CreatePostModal user={user} view={currentView} />
    </>
  )
}

export default App