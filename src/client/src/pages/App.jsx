import { useState, useEffect } from 'react';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { checkStatus } from "../static/api.js";

import Feed from "../components/feed"; 
import "../static/styles/feed_override.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkStatus().then(data => {
      if (data.authenticated) {
        setUser(data.user);
      }
    }).catch(err => console.error("Not logged in", err));
  }, []);

  return (
    <>
        <NavBar user={user} />
        <main style={{ display: "flex", justifyContent: "center", marginTop: "60px" }}>
            <SideBar />
            
            {/* Insert Feed Here */}
            <div className="main-container" style={{ flex: 1, padding: "20px" }}>
                {user ? (
                    <Feed user={user} />
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                        <h2>Welcome to SGEN</h2>
                        <p>Please log in to view the community feed.</p>
                    </div>
                )}
            </div>
        </main>
    </>
  )
}

export default App