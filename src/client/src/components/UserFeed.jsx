import { useState, useEffect } from "react";
import { fetchData } from "../static/api";
import PostCard from "./sub components/post_card";
import { DropdownElement } from "./sub components/create_button";
import "../static/styles/feed_override.css";

export default function UserFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    const userId = (userIndex !== -1 && pathParts[userIndex + 1]) ? pathParts[userIndex + 1] : null;

    useEffect(() => {
        async function loadUserHistory() {
            if (!userId) return;

            try {
                setLoading(true);
                const data = await fetchData(`user/${userId}/posts`);
                const postList = data.posts || data || [];
                setPosts(postList);
            } catch (err) {
                console.error("User Feed error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadUserHistory();
    }, [userId]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    if (!userId) return <div style={{textAlign:'center', padding:'20px'}}>User ID not found</div>;

    return (
        <div className="feed-container">
            <div className="feed-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Post History</h2>
                <div style={{ listStyle: "none" }}>
                    <DropdownElement icon="article" text="New Post" link="/create/post"/>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center" }}>Loading history...</div>
            ) : (
                <div className="posts-list">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.postId || post.post_id}
                                post={post}
                                currentUser={post.author}
                                onDelete={removePost}
                                view={{ type: "user", id: userId }}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", color: "#888" }}>No post history found.</div>
                    )}
                </div>
            )}
        </div>
    );
}