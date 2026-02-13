import { useState, useEffect } from "react";
import { fetchData, checkStatus } from "../static/api";
import PostCard from "./sub components/post_card";
import { DropdownElement } from "./sub components/create_button";
import "../static/styles/feed_override.css";

export default function HomeFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [postsData, authData] = await Promise.all([
                    fetchData("feed"),
                    checkStatus().catch(() => ({ user: null }))
                ]);

                const postList = postsData.posts || postsData || [];
                setPosts(postList);

                if (authData && authData.user) {
                    setCurrentUser(authData.user);
                }
            } catch (err) {
                console.error("Home Feed error:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    return (
        <div className="feed-container">
            <div className="feed-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Home Feed</h2>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    <DropdownElement icon="article" text="New Post" link="/create/post"/>
                </ul>
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
                                currentUser={currentUser}
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