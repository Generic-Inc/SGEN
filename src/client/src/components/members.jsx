import {getCommunityIdFromPage} from "../static/api.js";
import {useEffect, useState} from "react";
import NavBar from "./nav_bar.jsx";
import SideBar from "./side_bar.jsx";
import MemberCard from "./sub components/member_card.jsx";
import "../static/styles/community.css"

export default function Members() {
    const [community, setCommunity] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const communityId = getCommunityIdFromPage();

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

                const [communityRes, membersRes] = await Promise.all([
                    fetch(`/api/community/${communityId}`),
                    fetch(`/api/community/${communityId}/members`),
                ]);

                if (!communityRes.ok || !membersRes.ok) {
                    throw new Error("Network response was not ok");
                }

                const communityData = await communityRes.json();
                const membersData = await membersRes.json();

                if (cancelled) return;

                setCommunity(communityData);
                setMembers(membersData.members ?? []);
            } catch (error) {
                console.error("Error loading members page:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [communityId]);

    if (loading) return null;
    console.log(members)
    return (
        <>
            <div className="members-container">
                <h1 className="community-title">Members of {community?.displayName}</h1>
                <ul className="members-list">
                    {members.map((member) => (
                        <li key={member.userId}>
                            <MemberCard member={member} />
                        </li>
                    ))}
                </ul>
            </div>

        </>
    );
}
