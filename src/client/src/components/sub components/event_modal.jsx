import { useState, useEffect } from 'react';

export default function EventModal({ event, onClose, onSave }) {
    const [formData, setFormData] = useState({
        eventName: '',
        eventDescription: '',
        scheduledDate: '',
        eventLocation: '',
        imageUrl: ''
    });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (event) {
            const dateTime = event.scheduledDate.replace(' ', 'T').substring(0, 16);
            setFormData({
                eventName: event.eventName,
                eventDescription: event.eventDescription || '',
                scheduledDate: dateTime,
                eventLocation: event.eventLocation,
                imageUrl: event.imageUrl || ''
            });
            if (event.imageUrl) {
                setImagePreview(event.imageUrl);
            }
        }
    }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
                setFormData(prev => ({ ...prev, imageUrl: e.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            scheduledDate: formData.scheduledDate.replace('T', ' ') + ':00'
        };

        onSave(submitData);
    };

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{event ? 'Edit Event' : 'Create New Event'}</h2>
                    <span className="close-modal" onClick={onClose}>&times;</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Event Image</label>
                        <div
                            className="image-upload-zone"
                            onClick={() => document.getElementById('eventImageInput').click()}
                        >
                            <span className="material-icons">add_photo_alternate</span>
                            <span>Add an image</span>
                            <input
                                type="file"
                                id="eventImageInput"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                        </div>
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="image-preview"
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Event Title *</label>
                        <input
                            type="text"
                            name="eventName"
                            className="form-input"
                            placeholder="Give your event a name"
                            value={formData.eventName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="eventDescription"
                            className="form-textarea"
                            rows="4"
                            placeholder="Tell people what this event is about"
                            value={formData.eventDescription}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date & Time *</label>
                            <input
                                type="datetime-local"
                                name="scheduledDate"
                                className="form-input"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Location *</label>
                            <input
                                type="text"
                                name="eventLocation"
                                className="form-input"
                                placeholder="Where will this happen?"
                                value={formData.eventLocation}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {event ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}