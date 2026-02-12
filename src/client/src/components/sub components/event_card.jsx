import { useState } from 'react';

export default function EventCard({ event, communityId, onEdit, onDelete, onToggleInterest }) {
    const [showMenu, setShowMenu] = useState(false);

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

    return (
        <div className="event-card" data-event-date={event.scheduledDate.split(' ')[0]}>
            <div className="event-header">
                <h3 className="event-title">{event.eventName}</h3>
                <div className="event-header-actions">
                    <span className="event-date-badge">
                        in {event.daysUntil} days
                    </span>
                    <button className="event-menu-btn" onClick={toggleMenu}>
                        <span className="material-icons">more_vert</span>
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
                    <span className="material-icons">place</span>
                    {event.eventLocation}
                </span>
                <span className="event-time">
                    <span className="material-icons">schedule</span>
                    {event.scheduledDate}
                </span>
            </div>

            <div className="event-actions">
                <button
                    className={`event-action-btn ${event.userIsInterested ? 'interested' : ''}`}
                    onClick={() => onToggleInterest(event.eventId)}
                >
                    <span className="material-icons">star</span>
                    <span className="interest-count">{event.interestedCount}</span>
                    <span className="interest-text">Interested</span>
                </button>

                <button className="event-action-btn">
                    <span className="material-icons">comment</span>
                    <span>31</span>
                </button>

                <button className="event-action-btn">
                    <span className="material-icons">share</span>
                    <span>Share</span>
                </button>
            </div>

            {showMenu && (
                <div className="event-menu">
                    <button onClick={handleEdit}>
                        <span className="material-icons">edit</span>
                        Edit
                    </button>
                    <button onClick={handleDelete} className="delete-option">
                        <span className="material-icons">delete</span>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}