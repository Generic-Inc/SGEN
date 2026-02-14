import { useState, useEffect, useCallback } from "react";
import { fetchData, checkStatus, getCommunityIdFromPage } from "../static/api";
import PostCard from "./sub components/post_card";
import "../static/styles/feed_override.css";

export default function CommunityFeed() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const communityId = getCommunityIdFromPage();

    useEffect(() => {
        if (!communityId) return;

        async function init() {
            setLoading(true);
            setPage(1);
            setHasMore(true);

            try {
                const [authData, postsData] = await Promise.all([
                    checkStatus().catch(() => ({ user: null })),
                    fetchData(`community/${communityId}/posts?page=1`)
                ]);

                if (authData?.user) setCurrentUser(authData.user);

                const newPosts = postsData.posts || [];
                setPosts(newPosts);

                if (newPosts.length < 10) setHasMore(false);

            } catch (err) {
                console.error(err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [communityId]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore || !communityId) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            const data = await fetchData(`community/${communityId}/posts?page=${nextPage}`);
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
            console.error("Failed to load more:", err);
        } finally {
            setLoading(false);
        }
    }, [page, hasMore, loading, communityId]);

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

    if (!communityId) return null;

    return (
        <div className="feed-container">
            {error && <div style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</div>}

            <div className="posts-list" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard
                            key={post.postId || post.post_id}
                            post={post}
                            currentUser={currentUser}
                            onDelete={removePost}
                            view={{ type: "community", id: communityId }}
                        />
                    ))
                ) : (
                    !loading && <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>No posts yet.</div>
                )}
            </div>

            {loading && <div style={{ textAlign: "center", padding: "20px", width: '100%' }}>Loading more...</div>}
            {!hasMore && posts.length > 0 && <div style={{ textAlign: "center", padding: "20px", color: "#ccc", width: '100%' }}>End of feed.</div>}
        </div>
    );
}