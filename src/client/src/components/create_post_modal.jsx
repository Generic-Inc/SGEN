import { useState, useEffect } from "react";
import { fetchData, postData } from "../static/api";
import "../static/styles/community.css";

export default function CreatePostModal({ user, view }) {
    // 1. Internal State for Visibility
    const [isOpen, setIsOpen] = useState(false);

    // 2. Data State
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 3. LISTEN for the "openPostModal" event here!
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("openPostModal", handleOpen);
        return () => window.removeEventListener("openPostModal", handleOpen);
    }, []);

    // 4. Load Communities when opening
    useEffect(() => {
        if (!isOpen) return; // Only load if open

        async function loadContext() {
            if (view.type === "community" && view.id) {
                setSelectedCommunity(view.id);
            } else {
                try {
                    const data = await fetchData("my-communities");
                    const list = data.communities || [];
                    setCommunities(list);
                    if (list.length > 0) setSelectedCommunity(list[0].communityId || list[0].community_id);
                } catch (err) {
                    setError("Could not load communities.");
                }
            }
        }
        loadContext();
    }, [isOpen, view]);

    const onClose = () => setIsOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCommunity) return setError("Please select a community.");
        if (!content.trim()) return setError("Post content cannot be empty.");

        try {
            setLoading(true);
            await postData(`community/${selectedCommunity}/posts`, {
                content: content,
                imageUrl: imageUrl
            });
            onClose();
            window.location.reload();
        } catch (err) {
            setError(err.message || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    // 5. If closed, render NOTHING (Invisible)
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 2000
        }}>
            <div className="modal-content" style={{
                background: "white", padding: "20px", borderRadius: "8px", width: "90%", maxWidth: "500px",
                position: "relative"
            }}>
                <button onClick={onClose} style={{ position: "absolute", top: "10px", right: "10px", border: "none", background: "none", fontSize: "20px", cursor: "pointer" }}>
                    &times;
                </button>

                <h2>Create Post</h2>
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Community</label>
                        {view.type === "community" ? (
                            <div style={{ padding: "10px", background: "#eee", borderRadius: "4px" }}>
                                Posting to current community
                            </div>
                        ) : (
                            <select
                                value={selectedCommunity || ""}
                                onChange={(e) => setSelectedCommunity(e.target.value)}
                                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                            >
                                {communities.map(c => (
                                    <option key={c.communityId || c.community_id} value={c.communityId || c.community_id}>
                                        {c.displayName || c.display_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <textarea
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "4px", border: "1px solid #ddd", resize: "none" }}
                        />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <input
                            type="text"
                            placeholder="Image URL (optional)"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                        />
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <button type="button" onClick={onClose} style={{ marginRight: "10px", padding: "8px 16px", border: "none", background: "#eee", borderRadius: "4px", cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: "8px 16px", border: "none", background: "#1877F2", color: "white", borderRadius: "4px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Posting..." : "Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}