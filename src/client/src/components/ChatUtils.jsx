// src/components/ChatUtils.jsx
import React, { useState } from 'react';

// --- Helper: Check if URL is an image ---
export const isImage = (text) => {
    return text.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
};

// --- Helper: Format Time ---
export const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ""; }
};

// --- Component: Expandable Text (Read More) ---
export const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // If text is short, just show it.
    if (!text || text.length < 300) {
        return <span>{text}</span>;
    }

    // Calculate cutoff
    const showLimit = Math.max(100, Math.floor(text.length * 0.3));
    const displayText = isExpanded ? text : text.substring(0, showLimit) + "... ";

    return (
        <span>
            {displayText}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    border: 'none', background: 'none', padding: 0,
                    color: '#00b0f4', // Lighter blue for better contrast on dark/light modes
                    cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginLeft: '5px'
                }}
            >
                {isExpanded ? "Show Less" : "Read More"}
            </button>
        </span>
    );
};