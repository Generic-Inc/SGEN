// src/components/ChatUtils.jsx
import React, { useState } from 'react';

/* Component that shortens long messages with a toggle button */
export const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    /* Return full text if it is shorter than 300 characters */
    if (!text || text.length < 300) return <span>{text}</span>;

    /* Calculate a preview limit based on 30% of total length */
    const showLimit = Math.max(100, Math.floor(text.length * 0.3));
    const displayText = isExpanded ? text : text.substring(0, showLimit) + "... ";

    return (
        <span>
            {displayText}
            {/* Button to switch between partial and full message view */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ border: 'none', background: 'none', padding: 0, color: '#00b0f4', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginLeft: '5px' }}
            >
                {isExpanded ? "Show Less" : "Read More"}
            </button>
        </span>
    );
};