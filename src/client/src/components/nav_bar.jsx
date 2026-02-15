import {checkStatus} from "../static/api.js";
import {useEffect, useState} from "react";
import "../static/styles/nav.css"
import {CreateButton} from "./sub components/create_button.jsx";
import Profile from "./sub components/profile.jsx";
import {Navigate} from "react-router-dom";

export default function NavBar() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
        const result = await checkStatus();
        setData(result);
        setIsLoading(false);
    }
    fetchData();
    }, []);

    if (isLoading) {
        return <nav className="nav-bar">Loading...</nav>;
    }
    const user = data.user;
        return (
                <>
                <nav className="nav-bar">
                    <a href={"/"}>
                        <img src="https://i.ibb.co/YKjk4w4/SGEN-Logo.png" className="nav-icon" alt="SGEN" />
                    </a>
                    <div className="right-container">
                        <CreateButton />
                        <Profile className="nav-avatar" avatarUrl={user.avatarUrl} hrefUrl={`/user/${user?.userId}`}/>
                    </div>
                </nav>
            < />
        )

}

