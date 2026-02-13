import { useState, useEffect } from "react";
import { fetchData } from "../static/api";
import PostCard from "./sub components/post_card";
import { DropdownElement } from "./sub components/create_button";
import "../static/styles/feed_override.css";

export default function HomeFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHomeFeed() {
            try {
                setLoading(true);
                const data = await fetchData("feed");
                const postList = data.posts || data || [];
                setPosts(postList);
            } catch (err) {
                console.error("Home Feed error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadHomeFeed();
    }, []);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    return (
        <div className="feed-container">
            <div className="feed-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Home Feed</h2>
                <div style={{ listStyle: "none" }}>
                    <DropdownElement icon="article" text="New Post" link="/create/post"/>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center" }}>Loading your feed...</div>
            ) : (
                <div className="posts-list">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard
                                key={post.postId || post.post_id}
                                post={post}
                                currentUser={null}
                                onDelete={removePost}
                                view={{ type: "home" }}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: "center", color: "#888" }}>
                            <h3>Your feed is empty</h3>
                            <p>Join some communities to see posts here!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}