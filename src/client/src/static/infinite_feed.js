import { useState, useEffect, useCallback, useRef } from "react";
import { fetchData } from "../static/api";

export function useInfiniteFeed(apiEndpoint) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const isFetching = useRef(false);

    // 1. Reset and Load Page 1 when the endpoint changes (e.g. switching communities)
    useEffect(() => {
        if (!apiEndpoint) return;

        async function loadFirstPage() {
            // Prevent double-fetch
            if (isFetching.current) return;
            isFetching.current = true;

            setLoading(true);
            setPage(1);
            setHasMore(true);
            setPosts([]);

            try {
                const data = await fetchData(`${apiEndpoint}?page=1`);
                const newPosts = data.posts || [];
                setPosts(newPosts);
                if (newPosts.length < 10) setHasMore(false);
            } catch (err) {
                console.error("Feed Error:", err);
            } finally {
                setLoading(false);
                isFetching.current = false;
            }
        }
        loadFirstPage();
    }, [apiEndpoint]);

    // 2. Load More Function
    const loadMore = useCallback(async () => {
        if (isFetching.current || !hasMore || !apiEndpoint) return;

        isFetching.current = true;
        setLoading(true);

        try {
            const nextPage = page + 1;
            const data = await fetchData(`${apiEndpoint}?page=${nextPage}`);
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
            console.error("Load More Error:", err);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [page, hasMore, apiEndpoint]);

    // 3. Scroll Listener
    useEffect(() => {
        const handleScroll = (e) => {
            const target = e.target.scrollingElement || e.target;
            if (!target) return;

            const scrollTop = target.scrollTop || window.scrollY || 0;
            const clientHeight = target.clientHeight || window.innerHeight || 0;
            const scrollHeight = target.scrollHeight || document.documentElement.scrollHeight || 0;

            // Trigger when within 150px of bottom
            if (scrollTop + clientHeight >= scrollHeight - 150) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [loadMore]);

    const removePost = (id) => {
        setPosts(prev => prev.filter(p => (p.postId || p.post_id) !== id));
    };

    return { posts, loading, hasMore, removePost };
}