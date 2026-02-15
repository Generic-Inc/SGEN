import { useState, useEffect } from "react";
import "../../static/styles/senior.css";

export default function AccessibilityWidget() {
    // 1. Check browser storage for previous preference
    const [isSenior, setIsSenior] = useState(() => {
        return localStorage.getItem("sgen_senior_mode") === "true";
    });

    // 2. Sync with CSS class whenever state changes
    useEffect(() => {
        if (isSenior) {
            document.body.classList.add("senior-mode");
        } else {
            document.body.classList.remove("senior-mode");
        }
    }, [isSenior]);

    // 3. Toggle Handler (Pure Frontend)
    const toggleMode = () => {
        const newMode = !isSenior;
        setIsSenior(newMode);
        // Save to browser so it remembers after refresh
        localStorage.setItem("sgen_senior_mode", String(newMode));
    };

    return (
        <button
            onClick={toggleMode}
            title={isSenior ? "Disable Senior Mode" : "Enable Senior Mode"}
            style={{
                position: "fixed",
                bottom: "30px",
                right: "30px",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: isSenior ? "#444" : "#1877F2",
                color: "white",
                border: "none",
                fontSize: "30px",
                cursor: "pointer",
                zIndex: 9999,
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
            }}
        >
            {isSenior ? "👓" : "👁️"}
        </button>
    );
}