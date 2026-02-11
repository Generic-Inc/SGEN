import {useEffect, useRef, useState} from "react";

export function CreateButton() {
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

    // Helper to broadcast the signal
    const triggerPostModal = () => {
        setIsOpen(false);
        window.dispatchEvent(new Event("openPostModal"));
    };

    return (
        <div className="create-button-container" ref={containerRef}>
            <button className="create-button" onClick={toggleOverlay}>
                Create
            </button>

            <ul className={`dropdown-list ${isOpen ? 'shown' : ''}`} id="create-overlay">
                <DropdownElement icon="group" text="New Group" link="/create/group"/>
                <DropdownElement icon="event" text="New Event" link="/create/event"/>

                {/* MODIFIED: Dispatches Event instead of using Props */}
                <li className="dropdown-list-element" onClick={triggerPostModal}>
                    <a href="#" onClick={(e) => e.preventDefault()}>
                        <span className="material-symbols-outlined">article</span>
                        <span className="text">New Post</span>
                    </a>
                </li>
            </ul>
        </div>
    );
}

export function DropdownElement({ icon, text, link }) {
    return(
        <li className="dropdown-list-element">
            <a href={link}>
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text">{text}</span>
            </a>
        </li>
    )
}

export function CreateOverlay() {
    function onClick(e) {
        if (e.target.id === "create-overlay") {
            const overlay = document.getElementById('create-overlay');
            overlay.classList.remove('shown');
        }
    }

    return(<>
            <div className="create-overlay" id="create-overlay" onClick={onClick}>
                <div className="create-overlay-container">
                    <h2>Create:</h2>
                    <ul className="create-list">
                        <ListElement icon="group" text="New Group" link="/create/group" />
                        <ListElement icon="group" text="New Group" link="/create/group" />
                    </ul>
                </div>
            </div>
        </>
    )
}

export function ListElement({ icon, text, link }) {
    return(
        <li className="create-list-element">
            <a href={link}>
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text">{text}</span>
            </a>
        </li>
    )
}