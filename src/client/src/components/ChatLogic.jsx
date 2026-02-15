// src/components/ChatLogic.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchData, postData } from '../static/api.js';
import io from 'socket.io-client'; // 1. Import Socket.IO

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

export const useChatLogic = (API_URL, communityId, currentUserId) => {
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Create a Ref to hold the socket connection
    const socketRef = useRef();

    /* Retrieves community metadata */
    const fetchCommunityInfo = useCallback(async () => {
        try {
            const data = await fetchData(`community/${communityId}`);
            if (data) {
                setCommunity(data);
            } else {
                setCommunity({ display_name: "greenery walk", description: "Default Community Description" });
            }
        } catch (error) {
            console.error("Community fetch error:", error);
            setCommunity({ display_name: "Error", description: "Could not load community details." });
        }
    }, [communityId]);

    /* Retrieves the INITIAL list of chat messages */
const fetchInitialMessages = useCallback(async () => {
    setLoading(true); // Ensure loading starts
    try {
        const data = await fetchData(`community/${communityId}/messages`);
        if (data && data.messages) {
            setMessages(data.messages);
        }
    } catch (error) {
        console.error("Failed to load messages:", error);
        // Even if it fails (e.g., 403 Forbidden), we must stop loading
    } finally {
        setLoading(false); // This will now ALWAYS run
    }
}, [communityId]);

    /* 3. Setup WebSocket Connection & Listeners */
    useEffect(() => {
        if (!communityId) return;

        // Load initial data via HTTP
        fetchCommunityInfo();
        fetchInitialMessages();

        // Connect to Flask Server (Ensure port 5000 is correct)
        const socket = io("http://127.0.0.1:5000");
        socketRef.current = socket;

        // Join the specific room for this community
        socket.emit('join', { room: communityId });

        // Listen for incoming messages (Real-time!)
        socket.on('receive_message', (newMessage) => {
            setMessages((prevMessages) => {
                // Prevent duplicate messages if the server sends them twice
                if (prevMessages.some(msg => msg.messageId === newMessage.messageId)) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
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

        // Cleanup: Disconnect when leaving the page
        return () => {
            socket.disconnect();
        };
    }, [communityId, fetchCommunityInfo, fetchInitialMessages]);

    /* Sends a new message */
    const sendMessage = async (content) => {
        if (!content.trim()) return false;
        try {
            // We still use HTTP POST to send the message for security/validation
            await postData(`community/${communityId}/messages`, {
                userId: currentUserId,
                content: content
            });

            // 4. IMPORTANT: We REMOVED await fetchMessages() here.
            // Why? Because the server will "emit" the message back to us via the socket
            // and the 'receive_message' listener above will update the UI automatically.

            return true;
        } catch (error) {
            console.error("Send error:", error);
            return false;
        }
    };
    const editMessage = async (messageId, newContent) => {
    if (!newContent.trim()) return false;
    try {
        // Sends the new content to the specific message ID
        await postData(`community/${communityId}/messages/${messageId}`,
            { content: newContent },
            'PATCH'
        );
        return true;
    } catch (error) {
        console.error("Edit error:", error);
        return false;
    }
};
    const deleteMessage = async (messageId) => {
    try {
        // Tells the backend to delete the message
        await fetchData(`community/${communityId}/messages/${messageId}`, 'DELETE');
        return true;
    } catch (error) {
        console.error("Delete error:", error);
        return false;
    }
};

    /* Return 'fetchMessages' as an empty function or alias to initial fetch
       so existing UI code doesn't break if it tries to call it. */
    return { community, messages, loading, sendMessage,editMessage, deleteMessage, fetchMessages: fetchInitialMessages };
};