import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {checkStatus, fetchData} from "../static/api.js";
import "../static/styles/user_styles.css";
import "../static/styles/recommended_communities.css";

export default function RecommendedCommunities() {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadRecommendations() {
            try {
                await checkStatus();
                const data = await fetchData("user/communities/recommendations");
                if (isMounted) {
                    setCommunities(data?.communities || []);
                    setError("");
                }
            } catch (err) {
                if (isMounted) {
                    const message = err instanceof Error ? err.message : String(err);
                    setError(message || "Failed to load recommendations.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadRecommendations();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="recommended-page">
            <header className="recommended-header">
                <div>
                    <h2>Recommended Communities</h2>
                    <p>Based on your onboarding info, you might like these.</p>
                </div>
                <button type="button" className="recommended-home-button" onClick={() => navigate("/")}>Go to Home</button>
            </header>

            <section className="recommended-content">
                {loading && <p className="recommended-status">Loading recommendations...</p>}
                {!loading && error && <p className="recommended-status recommended-error">{error}</p>}
                {!loading && !error && communities.length === 0 && (
                    <p className="recommended-status">No recommendations yet. Check back later.</p>
                )}

                {!loading && !error && communities.length > 0 && (
                    <div className="user-communities-container recommended-grid">
                        {communities.map((community) => (
                            <button
                                key={community.communityId}
                                type="button"
                                className="user-community-card recommended-card"
                                onClick={() => navigate(`/community/${community.communityId}`)}
                            >
                                <img
                                    src={community.iconUrl || "/vite.svg"}
                                    className="user-community-icon recommended-icon"
                                    alt="Community icon"
                                />
                                <div className="user-community-info recommended-info">
                                    <h3 className="user-community-name">{community.displayName}</h3>
                                    {community.description && (
                                        <p className="recommended-description">{community.description}</p>
                                    )}
                                    {Number.isFinite(community.memberCount) && (
                                        <p className="recommended-members">{community.memberCount} members</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
