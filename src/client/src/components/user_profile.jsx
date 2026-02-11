import { useState, useEffect } from "react";
import { fetchData } from "../static/api";

export default function UserProfile({ userId }) {
    const [profile, setProfile] = useState(null);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadProfile() {
            if (!userId) return; // Safety check
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch User Details
                const userData = await fetchData(`user/${userId}`);

                // CRITICAL FIX: Check if API returned an error
                if (userData.error) {
                    throw new Error(userData.error);
                }
                setProfile(userData);

                // 2. Fetch User Communities
                const commData = await fetchData(`user/${userId}/communities`);
                setCommunities(commData.communities || []);
            } catch (err) {
                console.error("Profile error:", err);
                setError(err.message || "Failed to load profile.");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [userId]);

    if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>Loading profile...</div>;

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "40px", color: "red" }}>
                <h3>Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!profile) return <div style={{ textAlign: "center", padding: "40px" }}>User not found.</div>;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            {/* Header Card */}
            <div style={{
                background: "white", borderRadius: "8px", padding: "30px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)", textAlign: "center",
                marginBottom: "20px"
            }}>
                <img
                    src={profile.avatarUrl || profile.avatar_url || "https://placehold.co/100"}
                    alt={profile.displayName}
                    style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid #f0f2f5" }}
                />
                <h2 style={{ marginTop: "15px", marginBottom: "5px", color: "#050505" }}>{profile.displayName || profile.display_name}</h2>
                <p style={{ color: "#65676B", fontSize: "15px" }}>@{profile.username}</p>
                {profile.bio && (
                    <p style={{ marginTop: "15px", fontSize: "16px", color: "#050505", maxWidth: "600px", margin: "15px auto", lineHeight: "1.5" }}>
                        {profile.bio}
                    </p>
                )}
            </div>

            {/* Communities List */}
            <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "15px", color: "#050505" }}>Communities</h3>
            {communities.length === 0 ? (
                <div style={{ padding: "20px", background: "white", borderRadius: "8px", textAlign: "center", color: "#65676B" }}>
                    This user hasn't joined any communities yet.
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
                    {communities.map(comm => (
                        <a
                            key={comm.communityId || comm.community_id}
                            href={`/community/${comm.communityId || comm.community_id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <div style={{
                                background: "white", borderRadius: "8px", padding: "15px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "15px",
                                transition: "transform 0.2s"
                            }}>
                                <div style={{
                                    width: "50px", height: "50px", borderRadius: "8px",
                                    background: "#1877F2", color: "white", display: "flex",
                                    justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "20px"
                                }}>
                                    {(comm.displayName || comm.display_name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div style={{ overflow: "hidden" }}>
                                    <div style={{ fontWeight: "600", fontSize: "16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {comm.displayName || comm.display_name}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#65676B" }}>
                                        View Community
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}