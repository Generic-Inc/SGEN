
import '../static/styles/App.css'
import SignupOverlay from "../components/signup_overlay.jsx"
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";

function App() {
  return (
    <>
        <NavBar />
        <main>
            <SideBar />
            <div className="main-container"></div>
        </main>
    </>
  )
}

export default App
