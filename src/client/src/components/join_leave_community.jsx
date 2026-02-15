import {useCallback, useEffect, useMemo, useState} from "react";
import {checkStatus, deleteData, fetchData, getCommunityIdFromPage, postData} from "../static/api.js";

/**
 * Contract:
 * - GET community/{communityId}/members -> returns list of members (array)
 * - POST community/{communityId}/members -> joins current user
 * - DELETE community/{communityId}/members -> leaves current user
 */
export default function JoinLeaveCommunityButton({
    communityId: communityIdProp = null,
    className = "",
    onChange = null,
}) {
    const communityId = useMemo(() => communityIdProp ?? getCommunityIdFromPage(), [communityIdProp]);

    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [error, setError] = useState(null);

    const getComparableUserId = useCallback((u) => {
        if (!u) return null;
        if (typeof u === "string" || typeof u === "number") return String(u);
        return u.id != null ? String(u.id) : u.userId != null ? String(u.userId) : null;
    }, []);

    const getComparableUsername = useCallback((u) => {
        if (!u || typeof u !== "object") return null;
        return u.username != null ? String(u.username) : null;
    }, []);

    const isMemberInList = useCallback((membersPayload, meUser) => {
        if (!membersPayload || !meUser) return false;

        const members = Array.isArray(membersPayload) ? membersPayload : membersPayload.members;
        if (!Array.isArray(members)) return false;

        const meId = getComparableUserId(meUser);
        const meUsername = getComparableUsername(meUser);

        return members.some((m) => {
            // API shape: { user: {...}, role: "...", joined: "..." }
            const candidate = m && typeof m === "object" && "user" in m ? m.user : m;

            const memberId = getComparableUserId(candidate);
            if (meId && memberId && meId === memberId) return true;

            const memberUsername = getComparableUsername(candidate);
            return Boolean(meUsername && memberUsername && meUsername === memberUsername);
        });
    }, [getComparableUserId, getComparableUsername]);

    useEffect(() => {
        let cancelled = false;

        async function loadMembership() {
            if (!communityId) {
                setLoading(false);
                setIsMember(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const [{user: meUser}, membersPayload] = await Promise.all([
                    checkStatus(),
                    fetchData(`community/${communityId}/members`),
                ]);
                if (cancelled) return;

                setIsMember(isMemberInList(membersPayload, meUser));
            } catch (e) {
                if (!cancelled) setError(e?.message || "Failed to load membership");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadMembership();
        return () => {
            cancelled = true;
        };
    }, [communityId, isMemberInList]);

    async function handleClick() {
        if (!communityId || loading || mutating) return;

        setMutating(true);
        setError(null);
        try {
            if (isMember) {
                await deleteData(`community/${communityId}/members`);
                onChange?.(false);
                window.location.reload();
                return;
            }

            await postData(`community/${communityId}/members`, {});
            onChange?.(true);
            window.location.reload();
        } catch (e) {
            setError(e?.message || "Request failed");
        } finally {
            setMutating(false);
        }
    }

    const label = loading ? "Loading…" : isMember ? "Leave" : "Join";

    return (
        <div className={"community-joinleave"}>
            <button
                type={"button"}
                className={`community-joinleave-button ${isMember ? "is-member" : ""} ${className}`.trim()}
                onClick={handleClick}
                disabled={!communityId || loading || mutating}
            >
                {mutating ? "Please wait…" : label}
            </button>
            {error ? <div className={"community-joinleave-error"}>{error}</div> : null}
        </div>
    );
}
