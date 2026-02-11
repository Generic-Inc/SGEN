import { useState, useEffect } from "react";
import { checkStatus } from "../static/api";
import Feed from "./feed";

export default function MainContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus()
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Not logged in", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
    }

    return (
        <div className="main-container">

            {user ? (
                <Feed user={user} />
            ) : (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h2>Welcome to SGEN</h2>
                    <p>Please log in to view the community feed.</p>
                </div>
            )}
        </div>
    );
}