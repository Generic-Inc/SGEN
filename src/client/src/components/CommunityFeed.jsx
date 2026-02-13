import { useState, useEffect } from "react";
import { fetchData, getCommunityIdFromPage } from "../static/api";
import PostCard from "./sub components/post_card";
import { DropdownElement } from "./sub components/create_button";
import "../static/styles/feed_override.css";

export default function CommunityFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const communityId = getCommunityIdFromPage();

    useEffect(() => {
        async function loadCommunityPosts() {
            if (!communityId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await fetchData(`community/${communityId}/posts`);
                const postList = data.posts || data || [];
                setPosts(postList);
            } catch (err) {
                console.error("Community Feed error:", err);
                setError("Failed to load posts.");
            } finally {
                setLoading(false);
            }
        }

        loadCommunityPosts();
    }, [communityId]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    if (!communityId) return null;

    return (
        <div className="feed-container">
            <div className="feed-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Community Feed</h2>
                <div style={{ listStyle: "none" }}>
                    <DropdownElement icon="article" text="New Post" link="/create/post"/>
                </div>
            </div>

            {loading && <div style={{ textAlign: "center" }}>Loading...</div>}
            {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

            <div className="posts-list">
                {posts.map(post => (
                    <PostCard
                        key={post.postId || post.post_id}
                        post={post}
                        currentUser={post.author}
                        onDelete={removePost}
                        view={{ type: "community", id: communityId }}
                    />
                ))}
            </div>
        </div>
    );
}