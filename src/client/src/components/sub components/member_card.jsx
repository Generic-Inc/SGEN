import { useEffect, useMemo, useRef, useState } from "react";
import MemberCardOverlay from "./member_card_overlay.jsx";

export default function MemberCard({ member, canManageMembers = false, currentUserId = null, currentUserRole = null, onRoleUpdate, onRemoveMember }) {
    const user = member.user;

    const overlayId = useMemo(() => `overlay-${String(user.userId)}`, [user.userId]);

    const [shown, setShown] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [roleInput, setRoleInput] = useState(member?.role || "member");

    const hoverTimerRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!shown) {
            setPos({ x: e.pageX, y: e.pageY });
        }
    };

    const clearHoverTimer = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    };

    const handleEnter = (e) => {
        setPos({ x: e.clientX, y: e.clientY });

        clearHoverTimer();
        hoverTimerRef.current = setTimeout(() => {
            setShown(true);
        }, 500);
    };

    const handleLeave = () => {
        clearHoverTimer();
        setShown(false);
    };

    useEffect(() => {
        return () => clearHoverTimer();
    }, []);

    useEffect(() => {
        setRoleInput(member?.role || "member");
    }, [member?.role]);

    const memberUserId = user?.userId || user?.user_id || member?.userId || member?.user_id;
    const memberRole = member?.role || "";
    const isSelf = currentUserId && String(memberUserId) === String(currentUserId);
    const showActions = canManageMembers && !isSelf;
    const canUpdateRole = showActions && !(currentUserRole === "admin" && (memberRole === "owner" || memberRole === "admin"));
    const canRemoveMember = showActions && !(currentUserRole === "admin" && (memberRole === "owner" || memberRole === "admin"));

    const handleRoleSubmit = (e) => {
        e.preventDefault();
        if (!onRoleUpdate) return;
        onRoleUpdate(member, roleInput);
    };

    return (
        <>
            <div
                className="member-card"
                onMouseEnter={handleEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleLeave}
            >
                <a href={`/user/${memberUserId}`} className="member-card-link">
                    <img
                        src={user.avatarUrl}
                        className="member-avatar"
                        alt="member avatar"
                    />
                    <div className="member-info">
                        <h3 className="member-username">
                            {user.displayName} ({member.role})
                        </h3>
                        {user.bio != null && user.bio !== "" && (
                            <p className="member-bio">{user.bio}</p>
                        )}
                        <span className="member-join-date">Joined: {member.joined}</span>
                    </div>
                </a>

                {showActions && (
                    <div className="member-actions">
                        {canUpdateRole && (
                            <form className="member-role-form" onSubmit={handleRoleSubmit}>
                                <select
                                    value={roleInput}
                                    onChange={(e) => setRoleInput(e.target.value)}
                                    className="member-role-input"
                                >
                                    <option value="admin">admin</option>
                                    <option value="member">member</option>
                                    <option value="banned">banned</option>
                                </select>
                                <button type="submit" className="member-role-save">
                                    Update role
                                </button>
                            </form>
                        )}
                        {canRemoveMember && (
                            <button
                                type="button"
                                className="member-remove"
                                onClick={() => onRemoveMember && onRemoveMember(member)}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                )}
            </div>

            <MemberCardOverlay
                member={member}
                overlayId={overlayId}
                shown={shown}
                x={pos.x}
                y={pos.y}
            />
        </>
    );
}