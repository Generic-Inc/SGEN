import { useState, useEffect, useCallback } from "react";
import { fetchData, checkStatus } from "../static/api";
import PostCard from "./sub components/post_card";
import "../static/styles/feed_override.css";

export default function UserFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    const targetUserId = (userIndex !== -1 && pathParts[userIndex + 1]) ? pathParts[userIndex + 1] : null;

    useEffect(() => {
        if (!targetUserId) return;

        async function init() {
            setLoading(true);
            setPage(1);
            setHasMore(true);

            try {
                const [authData, postsData] = await Promise.all([
                    checkStatus().catch(() => ({ user: null })),
                    fetchData(`user/${targetUserId}/posts?page=1`)
                ]);

                if (authData?.user) setCurrentUser(authData.user);

                const newPosts = postsData.posts || [];
                setPosts(newPosts);

                if (newPosts.length < 10) setHasMore(false);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [targetUserId]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore || !targetUserId) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            const data = await fetchData(`user/${targetUserId}/posts?page=${nextPage}`);
            const newPosts = data.posts || [];

            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.postId || p.post_id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.postId || p.post_id));
                    return [...prev, ...uniqueNewPosts];
                });

                setPage(nextPage);
                if (newPosts.length < 10) setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, hasMore, loading, targetUserId]);

    useEffect(() => {
        const handleScroll = (e) => {
            const target = e.target.scrollingElement || e.target;
            const scrollTop = target.scrollTop || window.scrollY;
            const clientHeight = target.clientHeight || window.innerHeight;
            const scrollHeight = target.scrollHeight || document.documentElement.scrollHeight;

            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll, true); // capture: true
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [loadMore]);

    const removePost = (id) => {
        setPosts(posts.filter(p => (p.postId || p.post_id) !== id));
    };

    if (!targetUserId) return <div style={{textAlign:'center', padding:'20px'}}>User ID not found</div>;

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
                            view={{ type: "user", id: targetUserId }}
                        />
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