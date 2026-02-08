export default function MemberCardOverlay({ member, overlayId, shown, x, y }) {
    const user = member.user;

    return (
        <div
            className={`info-card-container${shown ? " shown" : ""}`}
            id={overlayId}
            style={{
                position: "fixed",
                top: y + 12,
                left: x + 12,
                pointerEvents: "none",
                zIndex: 9999,
            }}
        >
            <div className="info-card-profile-background">
                <img src={user.avatarUrl} alt="User Avatar" className="info-card-avatar" />
            </div>
            <div className="info-card-section">
                <h2 className="info-card-title">{user.displayName}</h2>
                <span className="info-card-subtitle">{user.username} - {user.language}</span>
            </div>
            <div className="info-card-section">
                <p className="info-card-bio">{user.bio}</p>
            </div>
            <div className="info-card-section">
                <span className="info-card-role">{member.role}</span>
            </div>
            <div className="info-card-section">
                <span className="info-card-other-info">Joined: {member.joined}</span>
                <span className="info-card-other-info">Created: {user.created}</span>
            </div>
        </div>
    );
}
