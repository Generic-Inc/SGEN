import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../components/navbar.jsx';
import SideBar from '../components/sidebar.jsx';
import Calendar from '../components/sub components/calendar.jsx';
import EventCard from '../components/sub components/event_card.jsx';
import EventModal from '../components/sub components/event_modal.jsx';
import { fetchData } from '../static/api.js';
import '../static/styles/events.css';

export default function Events() {
    const { communityId } = useParams();
    const [events, setEvents] = useState([]);
    const [community, setCommunity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [communityData, eventsData] = await Promise.all([
                    fetchData(`community/${communityId}`),
                    fetchData(`community/${communityId}/events`)
                ]);

                setCommunity(communityData);

                const formattedEvents = eventsData.events.map(event => {
                    const scheduledDate = new Date(event.scheduledDate);
                    const now = new Date();
                    const daysUntil = Math.ceil((scheduledDate - now) / (1000 * 60 * 60 * 24));

                    return {
                        ...event,
                        daysUntil: daysUntil > 0 ? daysUntil : 0
                    };
                });

                setEvents(formattedEvents.sort((a, b) =>
                    new Date(a.scheduledDate) - new Date(b.scheduledDate)
                ));
            } catch (error) {
                console.error('Error loading events:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [communityId]);

    const handleDateSelect = (dateStr) => {
        setSelectedDate(dateStr);
    };

    const handleCreateEvent = () => {
        setEditingEvent(null);
        setShowModal(true);
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setShowModal(true);
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await fetch(`/api/community/${communityId}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': document.cookie.split('token=')[1]?.split(';')[0]
                }
            });

            setEvents(events.filter(e => e.eventId !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    const handleToggleInterest = async (eventId) => {
        try {
            const response = await fetch(`/api/community/${communityId}/events/${eventId}/interest`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': document.cookie.split('token=')[1]?.split(';')[0]
                },
                body: JSON.stringify({})
            });

            const data = await response.json();

            setEvents(events.map(event =>
                event.eventId === eventId
                    ? {
                        ...event,
                        userIsInterested: data.isInterested,
                        interestedCount: data.interestedCount
                      }
                    : event
            ));
        } catch (error) {
            console.error('Error toggling interest:', error);
        }
    };

    const handleModalSave = async (eventData) => {
        try {
            const url = editingEvent
                ? `/api/community/${communityId}/events/${editingEvent.eventId}`
                : `/api/community/${communityId}/events`;

            const method = editingEvent ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': document.cookie.split('token=')[1]?.split(';')[0]
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save event');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Failed to save event');
        }
    };

    const filteredEvents = selectedDate
        ? events.filter(e => e.scheduledDate.startsWith(selectedDate))
        : events;

    const showAllEvents = () => {
        setSelectedDate(null);
    };

    if (isLoading) {
        return (
            <>
                <NavBar />
                <div className="container">
                    <SideBar />
                    <div className="main-content">
                        <p>Loading events...</p>
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
                    <div className="events-container">
                        <div className="calendar-section">
                            <Calendar
                                events={events}
                                onDateSelect={handleDateSelect}
                            />
                        </div>

                        <div className="events-list-section">
                            <div className="events-list-header">
                                <h2 className="section-heading">Upcoming events</h2>
                                <button
                                    className="btn-create-event"
                                    onClick={handleCreateEvent}
                                >
                                    <span className="material-icons">add</span>
                                    Create Event
                                </button>
                            </div>

                            <div className="events-scroll">
                                {filteredEvents.length === 0 ? (
                                    <div className="no-events-message">
                                        <p>No events scheduled for this date</p>
                                        {selectedDate && (
                                            <button
                                                className="btn-secondary"
                                                onClick={showAllEvents}
                                            >
                                                Show All Events
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    filteredEvents.map(event => (
                                        <EventCard
                                            key={event.eventId}
                                            event={event}
                                            communityId={communityId}
                                            onEdit={handleEditEvent}
                                            onDelete={handleDeleteEvent}
                                            onToggleInterest={handleToggleInterest}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <EventModal
                    event={editingEvent}
                    onClose={() => setShowModal(false)}
                    onSave={handleModalSave}
                />
            )}
        </>
    );
}