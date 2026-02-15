import { useState } from 'react';

export default function EventCard({ event, communityId, onEdit, onDelete, onToggleInterest, disableNavigation = false }) {
    const [showMenu, setShowMenu] = useState(false);
    const detailUrl = `${window.location.origin}/community/${communityId}/events/${event.eventId}`;

    const toggleMenu = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(event);
        setShowMenu(false);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(event.eventId);
        setShowMenu(false);
    };

    const handleOpenDetail = () => {
        if (disableNavigation) return;
        window.location.href = `/community/${communityId}/events/${event.eventId}`;
    };

    const handleToggleInterested = (e) => {
        e.stopPropagation();
        onToggleInterest(event.eventId);
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(detailUrl);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = detailUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            alert('Event link copied to clipboard.');
        } catch (error) {
            console.error('Failed to copy event link:', error);
            window.prompt('Copy event link:', detailUrl);
        }
    };

    return (
        <div
            className={`event-card ${disableNavigation ? '' : 'event-card-clickable'}`}
            data-event-date={event.scheduledDate.split(' ')[0]}
            onClick={handleOpenDetail}
        >
            <div className="event-header">
                <h3 className="event-title">{event.eventName}</h3>
                <div className="event-header-actions">
                    <span className="event-date-badge">
                        in {event.daysUntil} days
                    </span>
                    <button className="event-menu-btn" onClick={toggleMenu}>
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </div>

            {event.eventDescription && (
                <p className="event-description">{event.eventDescription}</p>
            )}

            {event.imageUrl && (
                <img
                    src={event.imageUrl}
                    alt={event.eventName}
                    className="event-image"
                />
            )}

            <div className="event-meta">
                <span className="event-location">
                    <span className="material-symbols-outlined">place</span>
                    {event.eventLocation}
                </span>
                <span className="event-time">
                    <span className="material-symbols-outlined">schedule</span>
                    {event.scheduledDate}
                </span>
            </div>

            <div className="event-actions">
                <button
                    className={`event-action-btn ${event.userIsInterested ? 'interested' : ''}`}
                    onClick={handleToggleInterested}
                >
                    <span className="material-symbols-outlined">star</span>
                    <span className="interest-count">{event.interestedCount}</span>
                    <span className="interest-text">Interested</span>
                </button>

                <button className="event-action-btn" onClick={handleShare}>
                    <span className="material-symbols-outlined">share</span>
                    <span>Copy Event Link</span>
                </button>
            </div>

            {showMenu && (
                <div className="event-menu">
                    <button onClick={handleEdit}>
                        <span className="material-symbols-outlined">edit</span>
                        Edit
                    </button>
                    <button onClick={handleDelete} className="delete-option">
                        <span className="material-symbols-outlined">delete</span>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
