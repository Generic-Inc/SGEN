import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import NavBar from '../components/nav_bar.jsx';
import SideBar from '../components/side_bar.jsx';
import CreateEventsModal from '../components/create_events_modal.jsx';
import Calendar from '../components/sub components/calendar.jsx';
import EventCard from '../components/sub components/event_card.jsx';
import EventModal from '../components/sub components/event_modal.jsx';
import { fetchData } from '../static/api';
import '../static/styles/events.css';

export default function Events() {
    const { communityId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [community, setCommunity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [userAge, setUserAge] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const apiBase = `/api/community/${communityId}`;

                const [communityResponse, eventsResponse, ageData] = await Promise.all([
                    fetch(apiBase, { credentials: 'include' }),
                    fetch(`${apiBase}/events`, { credentials: 'include' }),
                    fetchData('my-age') // Fetch user age
                ]);

                if (!communityResponse.ok || !eventsResponse.ok) {
                    throw new Error(`Failed to load data (${communityResponse.status}/${eventsResponse.status})`);
                }

                const communityData = await communityResponse.json();
                const eventsData = await eventsResponse.json();

                setCommunity(communityData);
                setUserAge(ageData.age);

                const eventsList = Array.isArray(eventsData?.events) ? eventsData.events : [];

                const formattedEvents = eventsList.map(event => {
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
            const response = await fetch(`/api/community/${communityId}/events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setEvents(prevEvents => prevEvents.filter(e => e.eventId !== eventId));
            } else {
                alert('Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    const handleToggleInterest = async (eventId) => {
        try {
            const response = await fetch(`/api/community/${communityId}/events/${eventId}/attendance`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'interested' })
            });

            if (!response.ok) {
                throw new Error('Failed to toggle interest');
            }

            const data = await response.json();

            setEvents(prevEvents => prevEvents.map(event =>
                event.eventId === eventId
                    ? {
                        ...event,
                        userIsInterested: !event.userIsInterested,
                        interestedCount: data.counts?.interested || 0
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
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                const savedEvent = await response.json();

                if (editingEvent) {
                    setEvents(prevEvents => prevEvents.map(e =>
                        e.eventId === savedEvent.eventId ? savedEvent : e
                    ));
                } else {
                    const now = new Date();
                    const scheduledDate = new Date(savedEvent.scheduledDate);
                    const daysUntil = Math.ceil((scheduledDate - now) / (1000 * 60 * 60 * 24));

                    setEvents(prevEvents => [...prevEvents, { ...savedEvent, daysUntil: daysUntil > 0 ? daysUntil : 0 }]);
                }

                setShowModal(false);
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

    const isCreateModalOpen = searchParams.get('createEvent') === '1';

    const closeCreateModal = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('createEvent');
        setSearchParams(nextParams, { replace: true });
    };

    const appendCreatedEvent = (newEvent) => {
        setEvents(prevEvents => [...prevEvents, newEvent].sort((a, b) =>
            new Date(a.scheduledDate) - new Date(b.scheduledDate)
        ));
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
                                            userAge={userAge} // ✅ Pass userAge prop
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

            <CreateEventsModal
                isOpen={isCreateModalOpen}
                communityId={communityId}
                onClose={closeCreateModal}
                onCreatedEvent={appendCreatedEvent}
            />
        </>
    );
}