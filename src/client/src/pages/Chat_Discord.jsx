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
// 2. CONFIGURATION
// ==========================================
const API_URL = "http://127.0.0.1:5000/api";
const CURRENT_USER_ID = 1;

// ==========================================
// 3. MAIN COMPONENT (DISCORD STYLE)
// ==========================================
export default function ChatPageDiscord() {

    const { communityId } = useParams();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [communityName, setCommunityName] = useState("Loading...");
    const messagesEndRef = useRef(null);

    // --- Helper: Format Time ---
    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            // Returns "Today at 4:30 PM" style
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ""; }
    };

    // --- Helper: Get Random Avatar Color ---
    const getAvatarColor = (id) => {
        const colors = ['#5865F2', '#EB459E', '#FEE75C', '#57F287', '#ED4245'];
        return colors[id % colors.length] || '#5865F2';
    };

    // ==========================================
    // 4. LOGIC
    // ==========================================
    useEffect(() => {
        const fetchCommunityInfo = async () => {
            try {
                const response = await fetch(`${API_URL}/community/${communityId}`, { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    setCommunityName(data.display_name || data.community_name || "Server");
                }
            } catch (error) { setCommunityName("Server"); }
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

    const onEmojiClick = (emojiObject) => {
        setInputText(prev => prev + emojiObject.emoji);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    // ==========================================
    // 5. RENDER (DISCORD UI)
    // ==========================================
    return (
        <>
            <NavBar />

            <main style={{
                position: 'fixed',
                top: '60px',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                overflow: 'hidden',
                backgroundColor: '#313338'
            }}>
                <SideBar />

                <div className="discord-container" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>

                    {/* --- CSS STYLES (DISCORD THEME) --- */}
                    <style>{`
                        .discord-container { background-color: #313338; color: #dbdee1; font-family: 'gg sans', sans-serif; }

                        /* Header */
                        .discord-header {
                            height: 48px;
                            border-bottom: 1px solid #26272d;
                            display: flex;
                            align-items: center;
                            padding: 0 16px;
                            font-size: 16px;
                            font-weight: bold;
                            color: #f2f3f5;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                        }
                        .hash-symbol { color: #949BA4; margin-right: 8px; font-size: 24px; }

                        /* Messages Area */
                        .discord-messages {
                            flex: 1;
                            overflow-y: auto;
                            padding: 20px 0;
                            display: flex;
                            flex-direction: column;
                        }

                        /* ✅ FIXED: Layout for Row */
                        .message-row {
                            display: flex;       /* Flexbox is Key */
                            padding: 2px 16px;
                            margin-top: 10px;    /* Space between messages */
                            align-items: flex-start; /* Align top */
                        }
                        .message-row:hover { background-color: rgba(2, 2, 2, 0.06); } 

                        /* Avatar */
                        .avatar-circle {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            margin-right: 16px;  /* Space between avatar and text */
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 18px;
                            flex-shrink: 0;      /* Don't squash avatar */
                        }

                        /* Text Column */
                        .msg-content-col { 
                            display: flex; 
                            flex-direction: column; /* Stack Name and Message */
                            justify-content: center;
                        }
                        
                        /* Header: Name + Time */
                        .msg-header { 
                            display: flex; 
                            align-items: baseline; 
                            gap: 8px; 
                            margin-bottom: 2px; /* Small gap before text */
                        }
                        .username { font-weight: 500; color: #f2f3f5; font-size: 16px; cursor: pointer; }
                        .username:hover { text-decoration: underline; }
                        .timestamp { font-size: 12px; color: #949BA4; }

                        /* Actual Message Text */
                        .msg-text {
                            font-size: 15px;
                            color: #dbdee1;
                            line-height: 1.375rem;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }

                        /* Input Area */
                        .discord-input-area {
                            padding: 0 16px 24px 16px;
                            background-color: #313338;
                        }
                        .input-wrapper {
                            background-color: #383a40;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            padding: 0 16px;
                        }
                        .plus-btn {
                            color: #b5bac1;
                            background: none;
                            border: none;
                            cursor: pointer;
                            margin-right: 12px;
                            display: flex;
                            align-items: center;
                        }
                        .discord-input {
                            flex: 1;
                            background: transparent;
                            border: none;
                            color: #dbdee1;
                            padding: 12px 0;
                            outline: none;
                            font-size: 15px;
                        }
                        .right-icons { display: flex; gap: 12px; }
                        .icon-btn { color: #b5bac1; cursor: pointer; background: none; border: none; display: flex; align-items: center; }
                        .icon-btn:hover { color: #f2f3f5; }
                        
                        .emoji-picker-container { position: absolute; bottom: 80px; right: 20px; z-index: 100; }
                    `}</style>
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

                    {/* --- HEADER --- */}
                    <div className="discord-header">
                        <span className="hash-symbol">#</span>
                        {communityName}
                    </div>

                    {/* --- MESSAGES LIST --- */}
                    <div className="discord-messages">
                        {loading && <div style={{textAlign: 'center', color: '#949BA4', marginTop: 20}}>Loading...</div>}

                        {messages.map(msg => {
                            const msgAuthorId = msg.author ? msg.author.userId : (msg.author_id || 0);
                            const displayName = msg.author ? msg.author.displayName : "User " + msgAuthorId;

                            return (
                                <div key={msg.messageId} className="message-row">
                                    {/* Left: Avatar */}
                                    <div className="avatar-circle" style={{backgroundColor: getAvatarColor(msgAuthorId)}}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Right: Text Column */}
                                    <div className="msg-content-col">
                                        <div className="msg-header">
                                            <span className="username">{displayName}</span>
                                            <span className="timestamp">{formatTime(msg.created)}</span>
                                        </div>
                                        <div className="msg-text">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* --- INPUT AREA --- */}
                    <div className="discord-input-area">
                        {showEmojiPicker && (
                            <div className="emoji-picker-container">
                                <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={350} width={300}/>
                            </div>
                        )}

                        <div className="input-wrapper">
                            <button className="plus-btn">
                                <span className="material-icons">add_circle</span>
                            </button>

                            <input
                                type="text"
                                className="discord-input"
                                placeholder={`Message #${communityName}`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />

                            <div className="right-icons">
                                <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                    <span className="material-icons">sentiment_satisfied_alt</span>
                                </button>
                                <button className="icon-btn" onClick={handleSendMessage} style={{color: inputText.trim() ? '#5865F2' : '#b5bac1'}}>
                                    <span className="material-icons">send</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </>
    );
}