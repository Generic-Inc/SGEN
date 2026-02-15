import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { checkStatus } from "../static/api.js";
import "../static/styles/user_styles.css";

export default function EditUserPage() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        displayName: "",
        bio: "",
        avatarUrl: "",
        language: "",
        email: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        let isActive = true;

        async function loadStatus() {
            try {
                const status = await checkStatus();
                const statusUser = status?.user || status?.account || status?.currentUser;
                const statusUserId =
                    statusUser?.userId ??
                    statusUser?.user_id ??
                    statusUser?.id ??
                    status?.userId ??
                    status?.user_id ??
                    null;
                if (isActive) {
                    setCurrentUserId(statusUserId);
                }
            } catch (err) {
                setError(err?.message || "Failed to load session.");
            }
        }

        loadStatus();
        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!userId) return;

        async function loadUser() {
            try {
                const response = await fetch(`/api/user/${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error(`Failed to load user (${response.status})`);
                }
                const data = await response.json();
                setForm({
                    displayName: data.displayName || "",
                    bio: data.bio || "",
                    avatarUrl: data.avatarUrl || "",
                    language: data.language || "",
                    email: data.email || "",
                });
            } catch (err) {
                setError(err?.message || "Failed to load user profile.");
            }
        }

        loadUser();
    }, [userId]);

    const isSelf = currentUserId && userId && String(currentUserId) === String(userId);

    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isSelf) {
            setError("You can only edit your own profile.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/user/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    displayName: form.displayName,
                    bio: form.bio,
                    avatarUrl: form.avatarUrl,
                    language: form.language,
                    email: form.email,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.error || payload?.message || "Failed to update profile.");
            }

            navigate(`/user/${userId}`);
        } catch (err) {
            setError(err?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavBar />
            <main>
                <SideBar />
                <div className="main-container">
                    <div className="edit-user-card">
                        <h2>Edit profile</h2>
                        {error && <div className="edit-user-error">{error}</div>}
                        {!isSelf && (
                            <div className="edit-user-warning">You can only edit your own profile.</div>
                        )}
                        <form onSubmit={handleSubmit} className="edit-user-form">
                            <label className="edit-user-label">
                                Display name
                                <input
                                    type="text"
                                    value={form.displayName}
                                    onChange={handleChange("displayName")}
                                    className="edit-user-input"
                                />
                            </label>
                            <label className="edit-user-label">
                                Bio
                                <textarea
                                    value={form.bio}
                                    onChange={handleChange("bio")}
                                    className="edit-user-textarea"
                                />
                            </label>
                            <label className="edit-user-label">
                                Avatar URL
                                <input
                                    type="text"
                                    value={form.avatarUrl}
                                    onChange={handleChange("avatarUrl")}
                                    className="edit-user-input"
                                />
                            </label>
                            <label className="edit-user-label">
                                Language
                                <select
                                    value={form.language}
                                    onChange={handleChange("language")}
                                    className="edit-user-input"
                                >
                                    <option value="">Select a language</option>
                                    <option value="en">English</option>
                                    <option value="zh">Mandarin</option>
                                    <option value="ms">Malay</option>
                                    <option value="ta">Tamil</option>
                                </select>
                            </label>
                            <div className="edit-user-actions">
                                <button type="button" className="edit-user-cancel" onClick={() => navigate(-1)}>
                                    Cancel
                                </button>
                                <button type="submit" className="edit-user-submit" disabled={loading || !isSelf}>
                                    {loading ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
