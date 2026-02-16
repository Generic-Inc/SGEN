import { useState, useEffect } from "react";
import { checkStatus, fetchData } from "../static/api"; // ✅ Imported fetchData
import PostCard from "./sub components/post_card";
import { useInfiniteFeed } from "../static/infinite_feed";
import "../static/styles/feed.css";

export default function HomeFeed() {
    const [currentUser, setCurrentUser] = useState(null);
    const { posts, loading, hasMore, removePost } = useInfiniteFeed("feed");

    useEffect(() => {
        async function loadUser() {
            try {
                const status = await checkStatus();
                if (status.user) {
                    // ✅ Fetch Age separately
                    const ageData = await fetchData("my-age");
                    // Merge it
                    setCurrentUser({ ...status.user, age: ageData.age });
                }
            } catch (e) { console.error(e); }
        }
        loadUser();
    }, []);

    return (
        <div className="feed-container">
            <div className="posts-list" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post.postId || post.post_id} post={post} currentUser={currentUser} onDelete={removePost} view={{ type: "home" }} />
                    ))
                ) : (
                    !loading && <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>No posts found.</div>
                )}
            </div>
            {loading && <div style={{ textAlign: "center", padding: "20px", width: '100%' }}>Loading more...</div>}
            {!hasMore && posts.length > 0 && <div style={{ textAlign: "center", padding: "20px", color: "#ccc", width: '100%' }}>You've reached the end!</div>}
        </div>
    );
}