import React, { useState } from 'react';

/* ===========================================================================
   1. EXPANDABLE TEXT COMPONENT
   Shortens long messages and adds a "Read More" / "Show Less" toggle.
=========================================================================== */
export const ExpandableText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text || text.length < 300) return <span>{text}</span>;

    const showLimit = Math.max(100, Math.floor(text.length * 0.3));
    const displayText = isExpanded ? text : text.substring(0, showLimit) + "... ";

    return (
        <span>
            {displayText}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    border: 'none', background: 'none', padding: 0,
                    color: '#00b0f4', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 'bold', marginLeft: '5px'
                }}
            >
                {isExpanded ? "Show Less" : "Read More"}
            </button>
        </span>
    );
};

/* ===========================================================================
   2. INLINE MESSAGE EDITOR COMPONENT
   Reusable edit box that automatically resizes and matches the current theme.
=========================================================================== */
export const InlineMessageEditor = ({ initialText, onSave, onCancel, theme }) => {
    const [text, setText] = useState(initialText);
    const isYouth = theme === 'youth';

    /* --- Action Handlers --- */
    const handleSave = () => {
        if (text.trim() !== "") onSave(text);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleAutoResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleFocus = (e) => {
        handleAutoResize(e);
        const val = e.target.value;
        e.target.value = '';
        e.target.value = val; // Moves cursor to the end
    };

    const handleChange = (e) => {
        setText(e.target.value);
        handleAutoResize(e);
    };

    /* --- Dynamic Theme Styles --- */
    const containerStyle = {
        display: 'flex', flexDirection: 'column',
        gap: isYouth ? '8px' : '10px',
        marginTop: isYouth ? '4px' : '6px'
    };

    const textAreaStyle = isYouth ? {
        width: '100%', minHeight: '40px', padding: '10px 14px', borderRadius: '8px',
        border: 'none', backgroundColor: '#383a40', color: '#dcddde', outline: 'none',
        fontSize: '15px', boxSizing: 'border-box', fontFamily: 'inherit',
        overflow: 'hidden', resize: 'none'
    } : {
        width: '100%', minHeight: '45px', padding: '12px 16px', borderRadius: '16px',
        border: '2px solid #25d366', outline: 'none', fontSize: '16px', backgroundColor: '#fff',
        color: '#111b21', boxSizing: 'border-box', fontFamily: 'inherit',
        overflow: 'hidden', resize: 'none'
    };

    const actionsStyle = {
        display: 'flex', gap: '8px',
        fontSize: isYouth ? '14px' : '15px',
        justifyContent: 'flex-end'
    };

    const cancelBtnStyle = isYouth ? {
        backgroundColor: 'transparent', color: '#00a8fc', padding: '6px 16px',
        cursor: 'pointer', border: 'none'
    } : {
        padding: '6px 16px', cursor: 'pointer', borderRadius: '20px',
        border: '1px solid #ccc', backgroundColor: '#fff', color: '#555', fontWeight: '500'
    };

    const saveBtnStyle = isYouth ? {
        backgroundColor: '#23a559', color: 'white', padding: '6px 16px',
        borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold'
    } : {
        padding: '6px 16px', cursor: 'pointer', borderRadius: '20px',
        border: 'none', backgroundColor: '#25d366', color: '#fff', fontWeight: 'bold'
    };

    /* --- Render --- */
    return (
        <div style={containerStyle}>
            <textarea
                value={text}
                autoFocus
                onFocus={handleFocus}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                style={textAreaStyle}
            />
            <div style={actionsStyle}>
                <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
                <button onClick={handleSave} style={saveBtnStyle}>Save</button>
            </div>
        </div>
    );
};