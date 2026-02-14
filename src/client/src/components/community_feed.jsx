import { useState, useEffect } from "react";
import { fetchData, checkStatus, getCommunityIdFromPage } from "../static/api";
import PostCard from "./sub components/post_card";
import "../static/styles/feed_override.css";

export default function CommunityFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const communityId = getCommunityIdFromPage();

    useEffect(() => {
        async function loadData() {
            if (!communityId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [postsData, authData] = await Promise.all([
                    fetchData(`community/${communityId}/posts`),
                    checkStatus().catch(() => ({ user: null }))
                ]);

                const postList = postsData.posts || postsData || [];
                setPosts(postList);

                if (authData && authData.user) {
                    setCurrentUser(authData.user);
                }

            } catch (err) {
                console.error("Community Feed error:", err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [communityId]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    if (!communityId) return null;

    return (
        <div className="feed-container">
            {loading && <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>}
            {error && <div style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</div>}

            <div className="posts-list">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard
                            key={post.postId || post.post_id}
                            post={post}
                            currentUser={currentUser}
                            onDelete={removePost}
                            view={{ type: "community", id: communityId }}
                        />
                    ))
                ) : (
                    !loading && <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>No posts yet.</div>
                )}
            </div>
        </div>
    );
}