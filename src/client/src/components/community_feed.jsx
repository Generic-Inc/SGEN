import { useState, useEffect } from "react";
import { checkStatus, getCommunityIdFromPage, fetchData } from "../static/api";
import PostCard from "./sub components/post_card";
import { useInfiniteFeed } from "../static/infinite_feed";
import "../static/styles/feed.css";

export default function CommunityFeed() {
    const [currentUser, setCurrentUser] = useState(null);
    const [myRole, setMyRole] = useState(null); // <--- Store ONLY the role
    const communityId = getCommunityIdFromPage();

    const apiEndpoint = communityId ? `community/${communityId}/posts` : null;
    const { posts, loading, hasMore, removePost } = useInfiniteFeed(apiEndpoint);

    // 1. Load Current User
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

    // 2. Load MY Role in this Community (The Missing Link!)
    useEffect(() => {
        async function fetchMyRole() {
            if (communityId && currentUser?.user_id) {
                try {
                    // We specifically ask: "Get member info for ME in THIS community"
                    const memberData = await fetchData(`community/${communityId}/members/${currentUser.user_id}`);
                    if (memberData && memberData.role) {
                        console.log("My Role in this community:", memberData.role);
                        setMyRole(memberData.role);
                    }
                } catch (err) {
                    console.log("Not a member or failed to fetch role");
                    setMyRole(null);
                }
            }
        }
        fetchMyRole();
    }, [communityId, currentUser]); // Runs once user is loaded

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

                            // ✅ PASS THE FETCHED ROLE CORRECTLY
                            communityRole={myRole}
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