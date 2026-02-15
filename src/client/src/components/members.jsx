import {getCommunityIdFromPage} from "../static/api.js";
import {useEffect, useState} from "react";
import MemberCard from "./sub components/member_card.jsx";
import {checkStatus} from "../static/api.js";
import "../static/styles/community.css"

export default function Members() {
    const [community, setCommunity] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [canManageMembers, setCanManageMembers] = useState(false);
    const [actionError, setActionError] = useState(null);
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
                    console.error("Error loading members page: bad response status");
                    return;
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

    useEffect(() => {
        let cancelled = false;
        const loadRole = async () => {
            if (!communityId) return;
            try {
                const status = await checkStatus();
                const userId = status?.user?.userId || status?.user?.user_id;
                if (!userId) return;

                const memberRes = await fetch(`/api/community/${communityId}/members/${userId}`, {
                    credentials: "include",
                });
                if (!memberRes.ok) return;


                const member = await memberRes.json();
                if (cancelled) return;
                console.log(member)

                setCurrentUserId(userId);
                setCanManageMembers(member?.role === "owner");
            } catch (error) {
                console.error("Error loading current user role:", error);
            }
        };

        loadRole();

        return () => {
            cancelled = true;
        };
    }, [communityId]);

    const getMemberUserId = (member) => {
        return member?.user?.userId || member?.user?.user_id || member?.userId || member?.user_id;
    };

    const handleRoleUpdate = async (member, nextRole) => {
        const userId = getMemberUserId(member);
        if (!userId) return;

        const normalizedRole = (nextRole || "").trim();
        const allowedRoles = new Set(["admin", "member", "banned"]);

        if (!normalizedRole) {
            setActionError("Role cannot be empty.");
            return;
        }

        if (!allowedRoles.has(normalizedRole)) {
            setActionError("Invalid role. Allowed roles: admin, member, banned.");
            return;
        }

        try {
            setActionError(null);
            const response = await fetch(`/api/community/${communityId}/members/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ role: normalizedRole }),
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.error || "Failed to update role.");
            }

            const updated = await response.json();
            setMembers((prev) => prev.map((m) => {
                const mId = getMemberUserId(m);
                if (mId === userId) {
                    return { ...m, role: updated?.role || normalizedRole };
                }
                return m;
            }));
        } catch (error) {
            setActionError(error.message || "Failed to update role.");
        }
    };

    const handleRemoveMember = async (member) => {
        const userId = getMemberUserId(member);
        if (!userId) return;
        if (!confirm("Remove this member from the community?")) return;

        try {
            setActionError(null);
            const response = await fetch(`/api/community/${communityId}/members/${userId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.error || "Failed to remove member.");
            }

            setMembers((prev) => prev.filter((m) => getMemberUserId(m) !== userId));
        } catch (error) {
            setActionError(error.message || "Failed to remove member.");
        }
    };

    if (loading) return null;

    return (
        <>
            <div className="members-container">
                <h1 className="community-title">Members of {community?.displayName}</h1>
                {actionError && <div className="member-action-error">{actionError}</div>}
                <ul className="members-list">
                    {members.map((member) => (
                        <li key={getMemberUserId(member)}>
                            <MemberCard
                                member={member}
                                currentUserId={currentUserId}
                                canManageMembers={canManageMembers}
                                onRoleUpdate={handleRoleUpdate}
                                onRemoveMember={handleRemoveMember}
                            />
                        </li>
                    ))}
                </ul>
            </div>

        </>
    );
}
