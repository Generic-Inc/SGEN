import { useState, useEffect } from "react";
import { checkStatus, getCommunityIdFromPage, fetchData } from "../static/api";
import PostCard from "./sub components/post_card";
import { useInfiniteFeed } from "../static/infinite_feed";
import "../static/styles/feed.css";

export default function CommunityFeed() {
    const [currentUser, setCurrentUser] = useState(null);
    const [communityData, setCommunityData] = useState(null); // To store role
    const communityId = getCommunityIdFromPage();

    const apiEndpoint = communityId ? `community/${communityId}/posts` : null;
    const { posts, loading, hasMore, removePost } = useInfiniteFeed(apiEndpoint);

    useEffect(() => {
        async function loadUser() {
            try {
                const status = await checkStatus();
                if (status.user) {
                    const onboardingData = await fetchData("user/onboarding");
                    setCurrentUser({ ...status.user, age: onboardingData.age });
                }
            } catch (e) { console.log("Standard mode active."); }
        }
        loadUser();
    }, []);

    // NEW: Fetch Community Data to get the User's Role
    useEffect(() => {
        if (communityId) {
            fetchData(`community/${communityId}`).then(data => {
                setCommunityData(data);
            }).catch(console.error);
        }
    }, [communityId]);

    if (!communityId) return null;

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
                            view={{ type: "community", id: communityId }}

                            // ✅ PASS ROLE HERE
                            communityRole={communityData?.role}
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