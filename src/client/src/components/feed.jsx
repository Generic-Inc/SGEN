import { useState, useEffect } from "react";
import { fetchData } from "../static/api";
import PostCard from "./sub components/post_card";
import InputBox from "./sub components/input_box";
import "../static/styles/feed_override.css";

export default function Feed({ user }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPosts() {
            try {
                const data = await fetchData("feed");
                if (data && data.posts) {
                    setPosts(data.posts);
                }
            } catch (error) {
                console.error("Feed error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadPosts();
    }, []);

    const removePost = (id) => {
        setPosts(posts.filter(p => p.postId !== id));
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading feed...</div>;

    return (
        <div className="feed-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Create Post Box */}
            <div style={{ marginBottom: "20px" }}>
                <InputBox user={user} />
            </div>

            {/* List of Posts */}
            {posts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888' }}>No posts available. Join a community!</div>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.postId}
                        post={post}
                        currentUser={user}
                        onDelete={removePost}
                    />
                ))
            )}
        </div>
    );
}