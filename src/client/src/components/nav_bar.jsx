import {checkStatus} from "../static/api.js";
import {useEffect, useState} from "react";
import "../static/styles/nav.css"
import {CreateButton} from "./sub components/create_button.jsx";
import Profile from "./sub components/profile.jsx";

export default function NavBar() {
    const [data, setData] = useState(null);
    data.onboarding = undefined;
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
         const fetchData = async () => {
                const result = await checkStatus();
                setData(result);
                setIsLoading(false);
         }
         fetchData();
    }, []);

     useEffect(() => {
         if (!isLoading && !data.onboarding){
            window.location.href = "/onboarding";
         }
     })


    if (!isLoading && data.user) {
        const user = data.user
        return (
            <>
                <nav className="nav-bar">
                    <img src="https://i.ibb.co/YKjk4w4/SGEN-Logo.png" className="nav-icon" alt="SGEN" />
                    <div className="right-container">
                        <CreateButton />
                        <Profile className="nav-avatar" avatarUrl={user.avatarUrl} hrefUrl={`/user/${user?.userId}`}/>
                    </div>
                </nav>
            < />
        )
    }

}

