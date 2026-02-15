// src/components/ChatLogic.jsx
import { useState, useEffect, useCallback } from 'react';

// ✅ FIXED: Use "./api" (Current Folder)
// Ensure you have moved api.js into the 'src/components/' folder first!
import { fetchData, postData } from '../static/api.js';

/* Checks if a message string ends in an image file extension */
export const isImage = (text) => {
    return text.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
};
// ... rest of your code ...

/* Converts server date strings into readable 12-hour time format */
export const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ""; }
};

/* Custom hook managing the primary "brain" of the chat system */
/* Note: API_URL is no longer needed here because api.js handles it */
export const useChatLogic = (API_URL, communityId, currentUserId) => {
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);

    /* Retrieves community metadata using the centralized fetchData helper */
    const fetchCommunityInfo = useCallback(async () => {
        try {
            // ✅ UPDATED: Use fetchData (automatically adds /api/ and credentials)
            const data = await fetchData(`community/${communityId}`);
            if (data) {
                setCommunity(data);
            } else {
                setCommunity({ display_name: "greenery walk", description: "Default Community Description" });
            }
        } catch (error) {
            console.error("Community fetch error:", error);
            /* Static fallback data if the server is unreachable */
            setCommunity({ display_name: "greenery walk", description: "We are NYP greenery cca to do our part in making singapore better countryh" });
        }
    }, [communityId]);

    /* Retrieves the list of chat messages for the current community */
    const fetchMessages = useCallback(async () => {
        try {
            // ✅ UPDATED: Use fetchData for messages
            const data = await fetchData(`community/${communityId}/messages`);
            if (data && data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Message fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    /* Sends a new message to the server and refreshes the list */
    const sendMessage = async (content) => {
        if (!content.trim()) return false;
        try {
            // ✅ UPDATED: Use postData for sending (handles CSRF/Cookies)
            await postData(`community/${communityId}/messages`, {
                userId: currentUserId,
                content: content
            });

            await fetchMessages(); // Refresh immediately on success
            return true;
        } catch (error) {
            console.error("Send error:", error);
            return false;
        }
    };

    /* Triggers the initial data pull when the component first mounts */
    useEffect(() => {
        if (communityId) {
            fetchCommunityInfo();
            fetchMessages();
        }
    }, [communityId, fetchCommunityInfo, fetchMessages]);

    /* Exports states and functions for use in UI components */
    return { community, messages, loading, sendMessage, fetchMessages };
};