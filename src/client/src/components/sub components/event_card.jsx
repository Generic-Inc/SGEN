import { useState } from 'react';
import SlangHighlighter from "./slang_highlighter";

export default function EventCard({ event, communityId, onEdit, onDelete, onToggleInterest, disableNavigation = false, userAge }) {
    const [showMenu, setShowMenu] = useState(false);

    const [isSpeaking, setIsSpeaking] = useState(false);

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

    const handleSpeak = (e) => {
        e.stopPropagation();
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(event.eventDescription);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const isSenior = userAge && userAge > 60;

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
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                    <p className="event-description" style={{ flex: 1, margin: 0 }}>
                        <SlangHighlighter text={event.eventDescription} userAge={userAge} />
                    </p>

                    {isSenior && (
                        <button
                            onClick={handleSpeak}
                            style={{
                                background: isSpeaking ? "#e0245e" : "#f0f2f5",
                                color: isSpeaking ? "white" : "#65676B",
                                border: "none",
                                borderRadius: "50%",
                                width: "30px",
                                height: "30px",
                                cursor: "pointer",
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                            }}
                            title={isSpeaking ? "Stop" : "Read"}
                        >
                            {isSpeaking ? "🔇" : "🔊"}
                        </button>
                    )}
                </div>
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