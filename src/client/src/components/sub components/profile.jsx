import {DropdownElement, DropdownWrapper} from "./dropdowns.jsx";
import {useEffect, useRef, useState} from "react";
import "../../static/styles/nav.css"

export default function Profile({avatarUrl, hrefUrl=null, className=null}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const toggleOverlay = () => setIsOpen(!isOpen);
    useEffect(() => {
        function handleDocumentClick(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, []);

    async function logout() {
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        window.location.href = "/login";
    }

    return <div onClick={toggleOverlay} ref={containerRef}>
        <img src={avatarUrl} alt="Profile Avatar" className={className ? className : "profile-avatar"} />
        <DropdownWrapper id={"profile-dropdown"} isOpen={isOpen}>
            <li className="dropdown-list-element">
                <div onClick={logout}>
                    <span className="material-symbols-outlined">{"logout"}</span>
                    <span className="text">{"Log Out"}</span>
                </div>
            </li>
        </DropdownWrapper>
    </div>
}
