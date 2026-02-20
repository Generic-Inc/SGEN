// React state hooks, custom API fetchers, and WebSocket client for real-time chat
import { useState, useEffect, useCallback } from 'react';
import { fetchData, postData } from '../static/api.js';
import io from 'socket.io-client';

/* Helper functions for message media detection and time formatting */
export const isImage = (text) => {
    return text && text.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
};

export const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ""; }
};

/* --- Chat Hook --- */
export const useChatLogic = (communityId) => {
    // Grab the ID from storage so we can track unique users
    const storedUserId = localStorage.getItem("currentUserId");

    /* --- API Calls --- */
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    /* --- Data Fetching --- */
    const fetchCommunityInfo = useCallback(async () => {
        try {
            const data = await fetchData(`community/${communityId}`);
            if (data) setCommunity(data);
        } catch (error) {
            console.error("Community fetch error:", error);
            setCommunity({ display_name: "Error", description: "Could not load details." });
        }
    }, [communityId]);

    const fetchInitialMessages = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchData(`community/${communityId}/messages`);
            if (data && data.messages) setMessages(data.messages);

            const userId = data && (data['current_user_id'] || data['currentUserId']);
            if (userId) setCurrentUser({ user_id: userId });
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    /* --- WebSocket Logic --- */
    useEffect(() => {
        if (!communityId) return;

        // Fetch data immediately when the room changes
        (async () => {
            await fetchCommunityInfo();
            await fetchInitialMessages();
        })();

        const socket = io("http://127.0.0.1:5000", { withCredentials: true });

        // @ts-ignore - Suppresses strict IDE type checking for the payload object
        socket.emit('join', ({
            room: communityId,
            user_id: storedUserId
        }));

        socket.on('connect_user_data', (userData) => {
            setCurrentUser(userData);
        });

        socket.on('receive_message', (newMessage) => {
            setMessages((prev) => {
                if (prev.some(msg => msg.messageId === newMessage.messageId)) return prev;
                return [...prev, newMessage];
            });
        });

        socket.on('message_edited', (updatedMsg) => {
            setMessages((prev) =>
                prev.map(msg => msg.messageId === updatedMsg.messageId ? updatedMsg : msg)
            );
        });

        socket.on('message_deleted', (data) => {
            setMessages((prev) => prev.filter(msg => msg.messageId !== data.messageId));
        });

        socket.on('room_data', (data) => {
            if (data && data.count !== undefined) setOnlineCount(data.count);
        });

        // Cleanup: Disconnect when the user leaves the page or changes room
        return () => {
            socket.disconnect();
        };
    }, [communityId, fetchCommunityInfo, fetchInitialMessages, storedUserId]);

    /* --- CRUD functions --- */
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
        currentUser,
        sendMessage,
        editMessage,
        deleteMessage,
        joinCommunity,
        fetchMessages: fetchInitialMessages
    };
};