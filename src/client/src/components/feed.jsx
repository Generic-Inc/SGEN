import { useState, useEffect } from "react";
import { fetchData } from "../static/api";
import PostCard from "./sub components/post_card";
import "../static/styles/feed_override.css";

export default function Feed({ user, view }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadPosts() {
            try {
                setLoading(true);
                let endpoint = "feed";

                if (view && view.type === "community" && view.id) {
                    endpoint = `community/${view.id}/posts`;
                }

                const data = await fetchData(endpoint);
                const postList = data.posts || data || [];

                setPosts(postList);
                setError(null);
            } catch (err) {
                console.error("Feed error:", err);
                setError(err.message || "Failed to load posts");
            } finally {
                setLoading(false);
            }
        }

        loadPosts();
    }, [view]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div className="feed-container">
            {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: "40px", color: '#888' }}>
                    <h3>No posts found</h3>
                    <p>{view?.type === 'community' ? "This community is empty." : "Join a community to see posts!"}</p>
                </div>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.postId || post.post_id}
                        post={post}
                        currentUser={user}
                        onDelete={removePost}
                        view={view}
                    />
                ))
            )}
        </div>
    );
}