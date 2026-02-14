import { useState, useEffect } from "react";
import { fetchData, postData, getCommunityIdFromPage } from "../static/api";
import "../static/styles/community.css";

export default function CreatePostModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState(""); // Default to empty
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentCommunityId = getCommunityIdFromPage();

    // --- THE MAGIC INTERCEPTOR (Kept this from before) ---
    useEffect(() => {
        const handleLinkClick = (e) => {
            const anchor = e.target.closest('a');
            if (anchor && anchor.getAttribute('href') === "/create/post") {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        const handleOpenEvent = () => setIsOpen(true);

        document.addEventListener("click", handleLinkClick);
        window.addEventListener("openPostModal", handleOpenEvent);

        return () => {
            document.removeEventListener("click", handleLinkClick);
            window.removeEventListener("openPostModal", handleOpenEvent);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        async function loadContext() {
            try {
                const data = await fetchData("my-communities");
                const list = data.communities || [];
                setCommunities(list);

                if (currentCommunityId) {
                    setSelectedCommunity(currentCommunityId);
                } else {
                    setSelectedCommunity("");
                }
            } catch (err) {
                setError("Could not load your communities.");
            }
        }
        loadContext();
    }, [isOpen, currentCommunityId]);

    const onClose = () => {
        setIsOpen(false);
        setError(null);
        setContent("");
        setImageUrl("");
        setSelectedCommunity(""); // Reset selection on close
    };

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
            window.location.reload();
        } catch (err) {
            setError(err.message || "Failed to create post.");
            setLoading(false);
        }
    };

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

                        <select
                            value={selectedCommunity}
                            onChange={(e) => setSelectedCommunity(e.target.value)}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                        >
                            {/* The "Placeholder" option */}
                            <option value="" disabled>Select a community...</option>

                            {communities.map(c => (
                                <option key={c.communityId || c.community_id} value={c.communityId || c.community_id}>
                                    {c.displayName || c.display_name}
                                </option>
                            ))}
                        </select>
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