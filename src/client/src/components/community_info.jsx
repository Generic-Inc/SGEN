import {useEffect, useState} from "react";
import {fetchData} from "../static/api.js";
import JoinLeaveCommunityButton from "./join_leave_community.jsx";
import FeedRouter from "./feed_router.jsx";
import EditCommunityModal from "./edit_community_modal.jsx";
import "../static/styles/App.css"

export default function CommunityInfo() {
    const [communityInfo, setCommunityInfo] = useState({})
    useEffect(() => {
        const communityId = window.location.pathname.split("/")[2]
        if (!communityId) return;
        const fetchCommunityInfo = async () => {
            try {
                const response = await fetchData(`community/${communityId}`);
                setCommunityInfo(response);
            } catch (error) {
                console.error("Error fetching community info:", error);

            }
        }
        fetchCommunityInfo();
        }, [])
    return (
        <>
            <EditCommunityModal />
            <div className={"community-page-row"}>
                <div className={"community-main-container"}>
                    <div className={"community-info"}>
                        <div className={"community-header-row"}>
                            <img src={communityInfo.iconUrl} alt={communityInfo.displayName ? `${communityInfo.displayName} icon` : "Community icon"} />
                            <h2>{communityInfo.displayName}</h2>
                        </div>
                        <div className={"community-second-row"}>
                            <h3>{communityInfo.communityName}</h3>
                        </div>
                        <div className={"community-joinleave-row"}>
                            <JoinLeaveCommunityButton />
                        </div>
                        <div style={{translateX: "10%"}}>
                            <FeedRouter />
                        </div>

                    </div>
                </div>
                <div className={"community-side-container"}>
                    <CommunitySideInfo communityInfo={communityInfo} />
                </div>
            </div>

        </>
    )
}

export function CommunitySideInfo({communityInfo}) {
    const description = communityInfo?.description ?? "";
    const online = communityInfo?.online ?? 0;
    const memberCount = communityInfo?.memberCount ?? 0;
    const offline = Math.max(0, memberCount - online);

    return (
        <div className={"community-side-box"}>
            <div className={"community-side-section"}>
                <div className={"community-side-label community-side-label--spaced"}>
                    Description
                </div>
                <div className={"community-side-description"}>
                    {description || "No description"}
                </div>
            </div>

            {/* Edit button: EditCommunityModal listens for this href and opens as an overlay */}
            <div className={"community-side-section"}>
                <a href="/edit/community" className={"community-side-edit-button"}>
                    Edit community
                </a>
            </div>

            <div className={"community-side-stats-row"}>
                <div className={"community-side-stat"}>
                    <div className={"community-side-label"}>{communityInfo.onlineText}</div>
                    <div className={"community-side-stat-value"}>{online}</div>
                </div>

                <div className={"community-side-stat"}>
                    <div className={"community-side-label"}>{communityInfo.offlineText}</div>
                    <div className={"community-side-stat-value"}>{offline}</div>
                </div>
            </div>
        </div>
    );
}
