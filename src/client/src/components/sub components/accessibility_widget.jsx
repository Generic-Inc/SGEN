import { useState, useEffect } from "react";
import { postData } from "../../static/api";
import "../../static/styles/senior.css";

export default function AccessibilityWidget({ currentUser }) {
    const [isSenior, setIsSenior] = useState(false);

    useEffect(() => {
        if (currentUser?.isSenior) {
            setIsSenior(true);
            document.body.classList.add("senior-mode");
        } else {
            setIsSenior(false);
            document.body.classList.remove("senior-mode");
        }
    }, [currentUser]);

    const toggleMode = async () => {
        try {
            const response = await postData("senior-mode", {});
            setIsSenior(response.isSenior);

            if (response.isSenior) {
                document.body.classList.add("senior-mode");
            } else {
                document.body.classList.remove("senior-mode");
            }
            window.location.reload();
        } catch (err) {
            console.error("Failed to toggle senior mode:", err);
        }
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