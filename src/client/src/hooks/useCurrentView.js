import { useState, useEffect } from "react";

export function useCurrentView() {
    const [view, setView] = useState({ type: "home", id: null });

    useEffect(() => {
        const path = window.location.pathname;

        if (path.includes("/community/")) {
            const parts = path.split("/");
            const idIndex = parts.indexOf("community") + 1;

            if (parts[idIndex]) {
                setView({ type: "community", id: parts[idIndex] });
            }
        } else {
            setView({ type: "home", id: null });
        }
    }, []);

    return view;
}