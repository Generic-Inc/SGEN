import { useEffect, useMemo, useRef, useState } from "react";
import MemberCardOverlay from "./member_card_overlay.jsx";

export default function MemberCard({ member }) {
    const user = member.user;

    const overlayId = useMemo(() => `overlay-${String(user.userId)}`, [user.userId]);

    const [shown, setShown] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });

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

    return (
        <>
            <a href={`/users/${user.userId}`}>
                <div className="member-card"
                     onMouseEnter={handleEnter}
                     onMouseMove={handleMouseMove}
                     onMouseLeave={handleLeave}>
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
                </div>
            </a>

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