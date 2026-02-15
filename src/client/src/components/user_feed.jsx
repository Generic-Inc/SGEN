import { useState, useEffect } from "react";
import { checkStatus } from "../static/api";
import PostCard from "./sub components/post_card";
import { useInfiniteFeed } from "../static/infinite_feed";
import "../static/styles/feed.css";

export default function UserFeed() {
    const [currentUser, setCurrentUser] = useState(null);

    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    const targetUserId = (userIndex !== -1 && pathParts[userIndex + 1]) ? pathParts[userIndex + 1] : null;

    // USE THE HOOK!
    const apiEndpoint = targetUserId ? `user/${targetUserId}/posts` : null;
    const { posts, loading, hasMore, removePost } = useInfiniteFeed(apiEndpoint);

    useEffect(() => {
        checkStatus().then(data => setCurrentUser(data.user)).catch(() => {});
    }, []);

    if (!targetUserId) return <div style={{textAlign:'center', padding:'20px'}}>User ID not found</div>;

    return (
        <div className="feed-container">
            <div className="posts-list" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post.postId || post.post_id} post={post} currentUser={currentUser} onDelete={removePost} view={{ type: "user", id: targetUserId }} />
                    ))
                ) : (
                    !loading && <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>No post history found.</div>
                )}
            </div>
            {loading && <div style={{ textAlign: "center", padding: "20px", width: '100%' }}>Loading history...</div>}
            {!hasMore && posts.length > 0 && <div style={{ textAlign: "center", padding: "20px", color: "#ccc", width: '100%' }}>No more posts.</div>}
        </div>
    );
}