// src/components/ChatLogic.jsx
import { useState, useEffect, useCallback } from 'react';

/* Checks if a message string ends in an image file extension */
export const isImage = (text) => {
    return text.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
};

/* Converts server date strings into readable 12-hour time format */
export const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ""; }
};

/* Custom hook managing the primary "brain" of the chat system */
export const useChatLogic = (API_URL, communityId, currentUserId) => {
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);

    /* Retrieves community metadata like name and description from the server */
    const fetchCommunityInfo = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/community/${communityId}`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setCommunity(data);
            } else {
                /* Static fallback data if the server is unreachable */
                setCommunity({ display_name: "greenery walk", description: "We are NYP greenery cca to do our part in making singapore better countryh" });
            }
        } catch (error) {
            console.error("Community fetch error:", error);
            setCommunity({ display_name: "greenery walk", description: "Network Error" });
        }
    }, [API_URL, communityId]);

    /* Retrieves the list of chat messages for the current community */
    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/community/${communityId}/messages`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.messages) setMessages(data.messages);
            }
        } catch (error) {
            console.error("Message fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, communityId]);

    /* Sends a new message to the server and refreshes the list */
    const sendMessage = async (content) => {
        if (!content.trim()) return false;
        try {
            const response = await fetch(`${API_URL}/community/${communityId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId, content: content }),
                credentials: 'include'
            });
            if (response.ok) {
                await fetchMessages();
                return true;
            }
            return false;
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