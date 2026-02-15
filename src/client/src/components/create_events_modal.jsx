import EventModal from './sub components/event_modal.jsx';

export default function CreateEventsModal({ isOpen, communityId, onClose, onCreatedEvent }) {
    if (!isOpen) return null;

    const handleSave = async (eventData) => {
        try {
            const response = await fetch(`/api/community/${communityId}/events`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create event');
            }

            const savedEvent = await response.json();
            const scheduledDate = new Date(savedEvent.scheduledDate);
            const now = new Date();
            const daysUntil = Math.ceil((scheduledDate - now) / (1000 * 60 * 60 * 24));

            onCreatedEvent({
                ...savedEvent,
                daysUntil: daysUntil > 0 ? daysUntil : 0
            });
            onClose();
        } catch (error) {
            console.error('Error creating event:', error);
            alert(error.message || 'Failed to create event');
        }
    };

    return (
        <EventModal
            event={null}
            onClose={onClose}
            onSave={handleSave}
        />
    );
}
