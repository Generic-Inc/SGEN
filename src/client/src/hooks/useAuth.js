import { useState, useEffect } from "react";
import { checkStatus } from "../static/api";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus()
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Auth check failed", err))
            .finally(() => setLoading(false));
    }, []);

    return { user, loading };
}