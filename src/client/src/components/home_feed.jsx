import { useState, useEffect, useCallback } from "react";
import { fetchData, checkStatus } from "../static/api";
import PostCard from "./sub components/post_card";
import "../static/styles/feed_override.css";

export default function HomeFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const authData = await checkStatus().catch(() => ({ user: null }));
                if (authData?.user) setCurrentUser(authData.user);
                const data = await fetchData(`feed?page=1`);
                const newPosts = data.posts || [];
                setPosts(newPosts);
                if (newPosts.length < 10) setHasMore(false);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            const data = await fetchData(`feed?page=${nextPage}`);
            const newPosts = data.posts || [];

            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
                setPage(nextPage);
                if (newPosts.length < 10) setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more:", err);
        } finally {
            setLoading(false);
        }
    }, [page, hasMore, loading]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
                loadMore();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    return (
        <div className="feed-container">
            <div className="posts-list" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
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
                    !loading && <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>No posts found.</div>
                )}
            </div>

            {loading && <div style={{ textAlign: "center", padding: "20px", width: '100%' }}>Loading more...</div>}
            {!hasMore && posts.length > 0 && <div style={{ textAlign: "center", padding: "20px", color: "#ccc", width: '100%' }}>You've reached the end!</div>}
        </div>
    );
}