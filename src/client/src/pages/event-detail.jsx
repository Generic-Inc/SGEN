import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/nav_bar.jsx';
import SideBar from '../components/side_bar.jsx';
import EventCard from '../components/sub components/event_card.jsx';
import '../static/styles/events.css';

export default function EventDetail() {
    const { communityId, eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadEvent = async () => {
            try {
                const response = await fetch(`/api/community/${communityId}/events/${eventId}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`Failed to load event (${response.status})`);
                }

                const eventData = await response.json();
                const scheduledDate = new Date(eventData.scheduledDate);
                const now = new Date();
                const daysUntil = Math.ceil((scheduledDate - now) / (1000 * 60 * 60 * 24));

                setEvent({
                    ...eventData,
                    daysUntil: daysUntil > 0 ? daysUntil : 0
                });
            } catch (error) {
                console.error('Error loading event detail:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEvent();
    }, [communityId, eventId]);

    const onEdit = () => {
        window.location.href = `/community/${communityId}/events`;
    };

    const onDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const response = await fetch(`/api/community/${communityId}/events/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                alert('Failed to delete event');
                return;
            }
            window.location.href = `/community/${communityId}/events`;
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    const onToggleInterest = async (id) => {
        try {
            const response = await fetch(`/api/community/${communityId}/events/${id}/attendance`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'interested' })
            });

            if (!response.ok) {
                throw new Error('Failed to toggle interest');
            }

            const data = await response.json();
            setEvent(prev => prev ? {
                ...prev,
                userIsInterested: !prev.userIsInterested,
                interestedCount: data.counts?.interested || 0
            } : prev);
        } catch (error) {
            console.error('Error toggling interest:', error);
        }
    };

    if (isLoading) {
        return (
            <>
                <NavBar />
                <div className="container">
                    <SideBar />
                    <div className="main-content">
                        <p>Loading event...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!event) {
        return (
            <>
                <NavBar />
                <div className="container">
                    <SideBar />
                    <div className="main-content">
                        <p>Event not found.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="container">
                <SideBar />
                <div className="main-content">
                    <div className="event-detail-wrapper">
                        <button
                            className="btn-secondary event-detail-back-btn"
                            onClick={() => { window.location.href = `/community/${communityId}/events`; }}
                        >
                            Back to Events
                        </button>
                        <EventCard
                            event={event}
                            communityId={communityId}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleInterest={onToggleInterest}
                            disableNavigation={true}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
