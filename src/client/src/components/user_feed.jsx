import { useState, useEffect } from "react";
import { fetchData, checkStatus } from "../static/api";
import PostCard from "./sub components/post_card";
import "../static/styles/feed_override.css";

export default function UserFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    const targetUserId = (userIndex !== -1 && pathParts[userIndex + 1]) ? pathParts[userIndex + 1] : null;

    useEffect(() => {
        async function loadData() {
            if (!targetUserId) return;

            try {
                setLoading(true);
                const [postsData, authData] = await Promise.all([
                    fetchData(`user/${targetUserId}/posts`),
                    checkStatus().catch(() => ({ user: null }))
                ]);

                const postList = postsData.posts || postsData || [];
                setPosts(postList);

                if (authData && authData.user) {
                    setCurrentUser(authData.user);
                }
            } catch (err) {
                console.error("User Feed error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [targetUserId]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    if (!targetUserId) return <div style={{textAlign:'center', padding:'20px'}}>User ID not found</div>;

    return (
        <div className="feed-container">
            {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>Loading history...</div>
            ) : (
                <div className="posts-list">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.postId || post.post_id}
                                post={post}
                                currentUser={currentUser}
                                onDelete={removePost}
                                view={{ type: "user", id: targetUserId }}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>No post history found.</div>
                    )}
                </div>
            )}
        </div>
    );
}