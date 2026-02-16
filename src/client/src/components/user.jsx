import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import "../static/styles/user_styles.css"
import FeedRouter from "./feed_router.jsx";
import { checkStatus } from "../static/api";

export default function UserComponent() {
    const [user, setUser] = useState({ name: "Loading..." });
    const [communities, setCommunities] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const userId = window.location.pathname.split("/")[2];
    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) return;

        const fetchUser = async () => {
            try {
                const response = await fetch(`/api/user/${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    console.error("Failed to fetch user data");
                    return;
                }

                const data = await response.json();
                setUser(data);
                const communitiesResponse = await fetch(`/api/user/${userId}/communities`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (communitiesResponse.ok) {
                    const communitiesData = await communitiesResponse.json();
                    setCommunities(communitiesData.communities);
                } else {
                    console.error("Failed to fetch user communities");
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchUser();
    }, [userId]);

    useEffect(() => {
        let isActive = true;

        async function loadStatus() {
            try {
                const status = await checkStatus();
                const statusUser = status?.user || status?.account || status?.currentUser;
                const statusUserId =
                    statusUser?.userId ??
                    statusUser?.user_id ??
                    statusUser?.id ??
                    status?.userId ??
                    status?.user_id ??
                    null;
                if (isActive) {
                    setCurrentUserId(statusUserId);
                }
            } catch (err) {
                console.error("Failed to check status", err);
            }
        }

        loadStatus();
        return () => {
            isActive = false;
        };
    }, []);

    if (!userId) {
        return <div style={{textAlign: 'center', padding: '20px'}}>User ID not found</div>;
    }

    const isSelf = currentUserId && userId && String(currentUserId) === String(userId);

    return (
        <>
            <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
                <div className={"main-user"}>
                    <MainCard user={user} isSelf={isSelf} onEdit={() => navigate(`/user/${userId}/edit`)} />
                </div>
                <div className={"side-user"}>
                    <UserCommunities communities={communities} />
                </div>
            </div>

            <FeedRouter />
        </>
    )

}

function MainCard({user, isSelf, onEdit}) {
 return (
     <div className={"user-main-card"}>
         <div className={"user-section"}>
             <img src={user.avatarUrl || "/vite.svg"} className={"user-avatar"} alt="User avatar" />
             <h1 className={"user-displayName"}>{user.displayName}</h1>
             <h2 className={"user-userName"}>{user.username} - {user.language}</h2>
         </div>
         <div className={"user-section"}>
             <p className={"user-bio"}>{user.bio}</p>
         </div>
         <div className={"user-section"}>Created: {user.created}</div>
         {isSelf && (
             <div className={"user-edit-actions"}>
                 <button type="button" className={"user-edit-button"} onClick={onEdit}>
                     Edit profile
                 </button>
             </div>
         )}

 </div> )
}

function UserCommunities({communities}) {
    if (communities.length === 0) {return null}
        return (
            <div className={"user-communities-side"}>
                <h2>Communities this user is in:</h2>
                <div className={"user-communities-container"}>
                    {communities.map((community) => (
                        <CommunityCard community={community} key={community.communityId} />
                    ))}
                </div>

            </div>
        )
}

function CommunityCard({community}) {
    return (
        <div className={"user-community-card"}>
            <img src={community.iconUrl || "/vite.svg"} className={"user-community-icon"} alt="Community icon" />
            <div className={"user-community-info"}>
                <h3 className={"user-community-name"}>{community.displayName}</h3>
            </div>
        </div>
    )
}