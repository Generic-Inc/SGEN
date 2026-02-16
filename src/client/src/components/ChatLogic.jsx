// src/components/ChatLogic.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchData, postData } from '../static/api.js';
import io from 'socket.io-client';

/* Checks if a message string ends in an image file extension */
export const isImage = (text) => {
    return text && text.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
};

/* Converts server date strings into readable 12-hour time format */
export const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ""; }
};

export const useChatLogic = (communityId) => {
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);

    /* -----------------------------------------------------------
       NEW: State to store the logged-in user's identity
       received via WebSocket handshake.
    ----------------------------------------------------------- */
    const [currentUser, setCurrentUser] = useState(null);

    const socketRef = useRef();

    /* Retrieves community metadata */
    const fetchCommunityInfo = useCallback(async () => {
        try {
            const data = await fetchData(`community/${communityId}`);
            if (data) setCommunity(data);
        } catch (error) {
            console.error("Community fetch error:", error);
            setCommunity({ display_name: "Error", description: "Could not load details." });
        }
    }, [communityId]);

    /* Retrieves the INITIAL list of chat messages */
    const fetchInitialMessages = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchData(`community/${communityId}/messages`);
            if (data && data.messages) setMessages(data.messages);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    /* Setup WebSocket Connection & Listeners */
    useEffect(() => {
        if (!communityId) return;

        fetchCommunityInfo();
        fetchInitialMessages();

        // Ensure credentials are included to share the secure token cookie
        const socket = io("http://127.0.0.1:5000", { withCredentials: true });
        socketRef.current = socket;

        socket.emit('join', { room: communityId });

        /* -----------------------------------------------------------
           NEW LISTENER: Identity Handshake
           Listen for the server to send back your user details.
        ----------------------------------------------------------- */
        socket.on('connect_user_data', (userData) => {
            console.log("WebSocket Handshake: Logged in as", userData);
            setCurrentUser(userData);
        });

        // LISTENER 1: New Messages
        socket.on('receive_message', (newMessage) => {
            setMessages((prev) => {
                if (prev.some(msg => msg.messageId === newMessage.messageId)) return prev;
                return [...prev, newMessage];
            });
        });

        // LISTENER 2: Message Edits
        socket.on('message_edited', (updatedMsg) => {
            setMessages((prev) =>
                prev.map(msg => msg.messageId === updatedMsg.messageId ? updatedMsg : msg)
            );
        });

        // LISTENER 3: Message Deletions
        socket.on('message_deleted', (data) => {
            setMessages((prev) => prev.filter(msg => msg.messageId !== data.messageId));
        });

        // LISTENER 4: Online Count
        socket.on('room_data', (data) => {
            if (data && data.count !== undefined) setOnlineCount(data.count);
        });

        return () => {
            socket.disconnect();
        };
    }, [communityId, fetchCommunityInfo, fetchInitialMessages]);

    /* Sends a new message */
    const sendMessage = async (content) => {
        if (!content.trim()) return false;
        try {
            await postData(`community/${communityId}/messages`, { content });
            return true;
        } catch (error) {
            console.error("Send error:", error);
            return false;
        }
    };

    /* Edits a message */
    const editMessage = async (messageId, newContent) => {
        if (!newContent.trim()) return false;
        try {
            const response = await fetch(`http://localhost:5000/api/community/${communityId}/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: newContent })
            });

            if (response.ok) {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.messageId === messageId ? { ...msg, content: newContent } : msg
                    )
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error("Edit error:", error);
            return false;
        }
    };

    /* Deletes a message */
    const deleteMessage = async (messageId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/community/${communityId}/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                setMessages((prevMessages) =>
                    prevMessages.filter((msg) => msg.messageId !== messageId)
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error("Delete error:", error);
            return false;
        }
    };

    /* Joins the community */
    const joinCommunity = async () => {
        try {
            const result = await postData(`community/${communityId}/join`, {});
            if (result.success) {
                await fetchCommunityInfo();
                await fetchInitialMessages();
                return true;
            }
        } catch (error) {
            console.error("Join error:", error);
        }
        return false;
    };

    return {
        community,
        messages,
        loading,
        onlineCount,
        currentUser, // NEW: Return this for identity checks in components
        sendMessage,
        editMessage,
        deleteMessage,
        joinCommunity,
        fetchMessages: fetchInitialMessages
    };
};