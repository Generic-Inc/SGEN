import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchData, postData } from "../static/api.js";
import "../static/styles/community.css";
import NavBar from "../components/nav_bar.jsx";

export default function CreatePostPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const paramCommunityId = searchParams.get("community_id") || searchParams.get("communityId") || "";

    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState(paramCommunityId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadContext() {
            try {
                const data = await fetchData("my-communities");
                setCommunities(data.communities || []);
                if (paramCommunityId) {
                    setSelectedCommunity(paramCommunityId);
                }
            } catch (err) {
                setError("Could not load communities.");
            }
        }
        loadContext();
    }, [paramCommunityId]);

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
            navigate(`/community/${selectedCommunity}`);
        } catch (err) {
            setError(err.message || "Failed to create post.");
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <NavBar />
            <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", background: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                <h2>Create New Post</h2>
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Choose Community</label>
                        <select
                            value={selectedCommunity}
                            onChange={(e) => setSelectedCommunity(e.target.value)}
                            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
                        >
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
                            style={{ width: "100%", height: "150px", padding: "10px", borderRadius: "4px", border: "1px solid #ddd", resize: "none", fontFamily: "inherit" }}
                        />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <input
                            type="text"
                            placeholder="Image URL (optional)"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
                        />
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <button type="button" onClick={() => navigate(-1)} style={{ marginRight: "10px", padding: "10px 20px", border: "none", background: "#eee", borderRadius: "4px", cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: "10px 20px", border: "none", background: "#1877F2", color: "white", borderRadius: "4px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Post" : "Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}