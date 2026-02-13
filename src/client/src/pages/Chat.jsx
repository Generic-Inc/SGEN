// ==========================================
// 1. IMPORTS
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";

// ==========================================
// 2. CONFIGURATION & CONSTANTS
// ==========================================
const API_URL = "http://127.0.0.1:5000/api";
const CURRENT_USER_ID = 1; // ⚠️ HARDCODED: Update this with real login logic later

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function ChatPage() {

    // --- Router Hooks ---
    const { communityId } = useParams();

    // --- State Management ---
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [communityName, setCommunityName] = useState("Loading...");

    // --- Refs ---
    const messagesEndRef = useRef(null);

    // ==========================================
    // 4. HELPER FUNCTIONS
    // ==========================================

    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ""; }
    };

    // ==========================================
    // 5. API CALLS
    // ==========================================

    useEffect(() => {
        const fetchCommunityInfo = async () => {
            try {
                const response = await fetch(`${API_URL}/community/${communityId}`, {
                    method: 'GET',
                    headers: { 'accept': '*/*', 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setCommunityName(data.display_name || data.community_name || "Community");
                }
            } catch (error) {
                console.error("Error fetching community info:", error);
                setCommunityName("Community");
            }
        };
        if (communityId) fetchCommunityInfo();
    }, [communityId]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/community/${communityId}/messages`);
            const data = await response.json();
            if (data.messages) setMessages(data.messages);
            setLoading(false);
        } catch (error) { console.error("Error fetching messages:", error); }
    };

    // --- Send Message ---
    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        setShowEmojiPicker(false);
        try {
            await fetch(`${API_URL}/community/${communityId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: CURRENT_USER_ID, content: inputText })
            });
            setInputText("");
            fetchMessages();
        } catch (error) { alert("Error sending message"); }
    };

    // ==========================================
    // 6. EVENT HANDLERS & EFFECTS
    // ==========================================

    const onEmojiClick = (emojiObject) => {
        setInputText(prev => prev + emojiObject.emoji);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    useEffect(() => {
        setLoading(true);
        setMessages([]);
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [communityId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ==========================================
    // 7. RENDER (JSX)
    // ==========================================
    return (
        <>
            <NavBar />

            {/* ✅ FIXED: Use 'position: fixed' to pin it correctly */}
            <main style={{
                position: 'fixed', // Pins the container so it can't scroll off-screen
                top: '60px',       // Starts EXACTLY below the NavBar
                bottom: 0,         // Stretches to the bottom of the screen
                left: 0,           // Stretches to the left edge
                right: 0,          // Stretches to the right edge
                display: 'flex',
                overflow: 'hidden' // Prevents double scrollbars
            }}>
                <SideBar />

                {/* --- MAIN CHAT CONTAINER --- */}
                <div className="main-container" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0
                }}>

                    <style>{`
                        /* Chat Box Layout */
                        .chat-box {
                            width: 100%; 
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            background-color: #fff;
                        }
                        
                        /* Header */
                        .chat-header {
                            height: 60px;
                            border-bottom: 1px solid #e0e0e0;
                            background: #fff;
                            display: flex;
                            align-items: center;
                            padding: 0 24px;
                            flex-shrink: 0;
                            font-size: 16px;
                            z-index: 10;
                        }

                        /* Messages Area */
                        .chat-messages-area {
                            flex: 1;
                            padding: 24px;
                            overflow-y: auto;
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                        }

                        /* Footer */
                        .chat-footer {
                            padding: 16px 24px;
                            background: #fff;
                            border-top: 1px solid #eee;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            flex-shrink: 0;
                            position: relative;
                            z-index: 10;
                        }

                        /* Message Bubbles */
                        .msg-bubble {
                            max-width: 60%;
                            padding: 12px 16px;
                            border-radius: 18px;
                            font-size: 14px;
                            line-height: 1.5;
                            position: relative;
                            box-shadow: 0 1px 1px rgba(0,0,0,0.05);
                        }
                        
                        .msg-left { align-self: flex-start; background-color: #fff; color: #1c1e21; border: 1px solid #e0e0e0; border-bottom-left-radius: 4px; }
                        .msg-right { align-self: flex-end; background-color: orange; color: #000; border: 1px solid transparent; border-bottom-right-radius: 4px; }
                        .msg-sender { font-weight: 600; font-size: 11px; margin-bottom: 4px; display: block; color: #65676B; }

                        .timestamp { font-size: 10px; color: #888; float: right; margin-top: 5px; margin-left: 8px; vertical-align: bottom; }

                        /* Inputs & Buttons */
                        .chat-input { flex: 1; border: 1px solid #ddd; background: #f0f2f5; padding: 12px 20px; border-radius: 24px; outline: none; font-size: 14px; transition: 0.2s; }
                        .chat-input:focus { background: #fff; border-color: #2196F3; }

                        .icon-btn { border: none; background: none; cursor: pointer; color: #555; padding: 5px; font-size: 20px; display: flex; align-items: center; justify-content: center; }
                        .icon-btn:hover { color: #0066FF; background-color: #f0f2f5; border-radius: 50%; }

                        .emoji-picker-container {
                            position: absolute;
                            bottom: 70px;
                            left: 20px;
                            z-index: 100;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                        }
                    `}</style>
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

                    <div className="chat-box">

                        {/* Header */}
                        <div className="chat-header">
                            <div style={{
                                width: 32, height: 32, background: '#e4e6eb', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginRight: 12, color: '#555', fontWeight: 'bold'
                            }}>#</div>
                            <strong>{communityName} Chat</strong>
                        </div>

                        {/* Messages List */}
                        <div className="chat-messages-area">
                            {loading && <div style={{textAlign: 'center', color: '#999', marginTop: 20}}>Loading...</div>}

                            {messages.map(msg => {
                                const msgAuthorId = msg.author ? msg.author.userId : (msg.author_id || 0);
                                const isMe = String(msgAuthorId) === String(CURRENT_USER_ID);
                                const displayName = msg.author ? msg.author.displayName : "User " + msgAuthorId;

                                return (
                                    <div key={msg.messageId} className={`msg-bubble ${isMe ? 'msg-right' : 'msg-left'}`}>
                                        <span className="msg-sender">{displayName} {isMe ? '(You)' : ''}</span>
                                        {msg.content}
                                        <span className="timestamp">{formatTime(msg.created)}</span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Footer */}
                        <div className="chat-footer">
                            <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emoji">
                                <span className="material-icons">sentiment_satisfied_alt</span>
                            </button>

                            {showEmojiPicker && (
                                <div className="emoji-picker-container">
                                    <EmojiPicker onEmojiClick={onEmojiClick} height={350} width={300}/>
                                </div>
                            )}

                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />

                            <button className="icon-btn" style={{color: '#0066FF'}} onClick={handleSendMessage}>
                                <span className="material-icons">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}