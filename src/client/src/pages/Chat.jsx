// ==========================================
// 1. IMPORTS
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
// ✅ NEW: Import shared tools instead of defining them here
import { isImage, formatTime, ExpandableText } from "../components/ChatUtils.jsx";

// ==========================================
// 2. CONFIGURATION & CONSTANTS
// ==========================================
const API_URL = "http://127.0.0.1:5000/api";
const CURRENT_USER_ID = 1;

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

    // Store full community object
    const [community, setCommunity] = useState(null);
    // Toggle for Profile Popup
    const [showProfile, setShowProfile] = useState(false);

    // --- Refs ---
    const messagesEndRef = useRef(null);

    // ==========================================
    // 4. API CALLS
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
                    setCommunity(data);
                } else {
                    setCommunity({
                        display_name: "greenery walk",
                        icon_url: null,
                        description: "We are NYP greenery cca to do our part in making singapore better countryh"
                    });
                }
            } catch (error) {
                setCommunity({
                    display_name: "greenery walk",
                    icon_url: null,
                    description: "We are NYP greenery cca to do our part in making singapore better countryh"
                });
            }
        };
        if (communityId) fetchCommunityInfo();
    }, [communityId]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/community/${communityId}/messages`, { credentials: 'include' });
            if (!response.ok) { setMessages([]); setLoading(false); return; }
            const data = await response.json();
            if (data.messages && Array.isArray(data.messages)) { setMessages(data.messages); }
            else { setMessages([]); }
        } catch (error) { setMessages([]); }
        finally { setLoading(false); }
    };

    const handleSendMessage = async (textToSend = inputText) => {
        if (!textToSend.trim()) return;
        setShowEmojiPicker(false);
        try {
            await fetch(`${API_URL}/community/${communityId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: CURRENT_USER_ID, content: textToSend }),
                credentials: 'include'
            });
            setInputText("");
            fetchMessages();
        } catch (error) { alert("Error sending message"); }
    };

    // ✅ Handle Image Link Button
    const handleImageLink = () => {
        const url = prompt("Paste an image URL (ending in .jpg, .png, etc):");
        if (url) {
            handleSendMessage(url);
        }
    };

    // ==========================================
    // 5. EVENT HANDLERS & EFFECTS
    // ==========================================
    const onEmojiClick = (emojiObject) => {
        setInputText(prev => prev + emojiObject.emoji);
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };
    useEffect(() => {
        setLoading(true); setMessages([]); fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [communityId]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ==========================================
    // 6. RENDER (JSX)
    // ==========================================

    const displayName = community ? (community.display_name || community.community_name) : "Loading...";
    const iconUrl = community?.icon_url || community?.iconUrl;

    return (
        <>
            <NavBar />

            <main style={{
                position: 'fixed', top: '60px', bottom: 0, left: 0, right: 0,
                display: 'flex', overflow: 'hidden'
            }}>
                <SideBar />

                {/* --- MAIN CHAT CONTAINER --- */}
                <div className="main-container" style={{
                }}>

                    <style>{`
                        * { box-sizing: border-box; }
                        
                        /* Layout */
                        .chat-box { 
                            width: 100%; 
                            height: 100%; 
                            display: flex; 
                            flex-direction: column; 
                            background-color: #efeae2; 
                        }
                        
                        /* Header */
                        .chat-header {
                            height: 60px; 
                            background: #f0f2f5; 
                            border-left: 1px solid #d1d7db; 
                            display: flex; 
                            align-items: center; 
                            padding: 0 16px;
                            flex-shrink: 0; 
                            z-index: 10; 
                            cursor: pointer;
                        }
                        
                        .header-icon-circle {
                            width: 32px; 
                            height: 32px; 
                            border-radius: 50%; 
                            background: #e4e6eb; 
                            margin-right: 12px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            cursor: pointer; 
                            overflow: hidden;
                            color: #555; 
                            font-weight: bold; 
                            transition: transform 0.2s;
                        }
                        .header-icon-circle:hover { transform: scale(1.1); background: #d0d2d6; }
                        .header-icon-img { width: 100%; height: 100%; object-fit: cover; }

                        /* Messages */
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

                        /* Bubbles */
                        .msg-bubble {
                            max-width: 60%; 
                            padding: 12px 16px; 
                            border-radius: 18px; 
                            font-size: 14px; 
                            line-height: 1.5; 
                            position: relative;
                            box-shadow: 0 1px 1px rgba(0,0,0,0.05);
                            overflow-wrap: break-word;
                            word-break: break-word;
                            white-space: pre-wrap;
                        }
                        .msg-left { 
                            align-self: flex-start; 
                            background-color: #fff; 
                            color: #1c1e21; 
                            border: 1px solid #e0e0e0; 
                            border-bottom-left-radius: 4px; 
                        }
                        .msg-right { 
                            align-self: flex-end; 
                            background-color: orange; 
                            color: #000; 
                            border: 1px solid transparent; 
                            border-bottom-right-radius: 4px; 
                        }
                        
                        .msg-sender { 
                            font-weight: 600; 
                            font-size: 11px; 
                            margin-bottom: 4px; 
                            display: block; 
                            color: #65676B; 
                        }
                        .timestamp { 
                            font-size: 10px; 
                            color: #888; 
                            float: right; 
                            margin-top: 5px; 
                            margin-left: 8px; 
                            vertical-align: bottom; 
                        }

                        /* Inputs */
                        .chat-input { 
                            flex: 1; 
                            border: 1px solid #ddd; 
                            background: #f0f2f5; 
                            padding: 12px 20px; 
                            border-radius: 24px; 
                            outline: none; 
                            font-size: 14px; 
                            transition: 0.2s; 
                        }
                        .chat-input:focus { background: #fff; border-color: #2196F3; }
                        
                        .icon-btn { 
                            border: none; 
                            background: none; 
                            cursor: pointer; 
                            color: #555; 
                            padding: 5px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                        }
                        .icon-btn:hover { color: #0066FF; background-color: #f0f2f5; border-radius: 50%; }
                        .emoji-picker-container { position: absolute; bottom: 70px; left: 20px; z-index: 100; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

                        /* ✅ PROFILE MODAL (Light Theme) */
                        .profile-modal-overlay {
                            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                            background-color: rgba(0,0,0,0.6);
                            z-index: 1000;
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                        }
                        .profile-modal {
                            width: 350px; background-color: #fff;
                            border-radius: 12px; 
                            overflow: hidden;
                            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                            position: relative; text-align: left;
                        }
                        .profile-banner { height: 70px; background-color: #4A90E2; }
                        .profile-avatar-wrapper {
                            position: absolute; top: 35px; left: 24px;
                            width: 72px; height: 72px;
                            border-radius: 50%; 
                            border: 4px solid #fff;
                            background-color: #e4e6eb; overflow: hidden;
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                        }
                        .profile-content { margin-top: 45px; padding: 0 24px 24px 24px; }
                        .profile-title { 
                            font-size: 22px; 
                            font-weight: bold; 
                            color: #1c1e21; 
                            margin-bottom: 2px; 
                        }
                        .profile-sub { 
                            font-size: 13px; 
                            color: #65676B; 
                            margin-bottom: 20px; 
                        }
                        .profile-desc-box {
                            background-color: #f7f8fa; padding: 16px;
                            border-radius: 8px; 
                            font-size: 14px; color: #333; line-height: 1.5;
                            border: 1px solid #eee;
                        }
                        .close-btn {
                            position: absolute; top: 12px; right: 12px;
                            background: rgba(0,0,0,0.1); border: none;
                            color: #fff; width: 28px; height: 28px; 
                            border-radius: 50%; 
                            cursor: pointer; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                        }
                        .close-btn:hover { background: rgba(0,0,0,0.3); }
                        
                        /* ✅ SHARED: Image Styling */
                        .chat-image {
                            max-width: 100%;       
                            max-height: 300px;     
                            width: auto;           
                            height: auto;          
                            object-fit: contain;   
                            border-radius: 12px;
                            margin-top: 5px;
                            display: block;
                        }
                    `}</style>
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

                    <div className="chat-box">

                        {/* Header */}
                        <div className="chat-header">
                            <div className="header-icon-circle" onClick={() => setShowProfile(true)} title="View Community Info">
                                {iconUrl ? (
                                    <img src={iconUrl} alt="Icon" className="header-icon-img"/>
                                ) : (
                                    <span>#</span>
                                )}
                            </div>
                            <strong>{displayName} Chat</strong>
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
                                        {/* ✅ UPDATED: Use Shared Helper Logic */}
                                        {isImage(msg.content) ? (
                                            <img src={msg.content} alt="sent" className="chat-image" referrerPolicy="no-referrer"/>
                                        ) : (
                                            <ExpandableText text={msg.content} />
                                        )}
                                        <span className="timestamp">{formatTime(msg.created)}</span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Footer */}
                        <div className="chat-footer">
                            {/* Image Link Button */}
                            <button className="icon-btn" onClick={handleImageLink} title="Add Image URL">
                                <span className="material-icons">add_photo_alternate</span>
                            </button>

                            <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emoji">
                                <span className="material-icons">sentiment_satisfied_alt</span>
                            </button>

                            {showEmojiPicker && (
                                <div className="emoji-picker-container">
                                    <EmojiPicker onEmojiClick={onEmojiClick} height={350} width={300}/>
                                </div>
                            )}

                            <input type="text" className="chat-input" placeholder="Type a message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} />
                            <button className="icon-btn" style={{color: '#0066FF'}} onClick={() => handleSendMessage()}> <span className="material-icons">send</span> </button>
                        </div>
                    </div>

                    {/* Profile Modal */}
                    {showProfile && community && (
                        <div className="profile-modal-overlay" onClick={() => setShowProfile(false)}>
                            <div className="profile-modal" onClick={e => e.stopPropagation()}>
                                <div className="profile-banner"></div>
                                <button className="close-btn" onClick={() => setShowProfile(false)}>
                                    <span className="material-icons" style={{fontSize: 18}}>close</span>
                                </button>

                                <div className="profile-avatar-wrapper">
                                    {iconUrl ? (
                                        <img src={iconUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="Icon" />
                                    ) : (
                                        <div style={{fontSize: 24, fontWeight: 'bold', color: '#888'}}>#</div>
                                    )}
                                </div>

                                <div className="profile-content">
                                    <div className="profile-title">{displayName}</div>

                                    <div className="profile-desc-box">
                                        <strong style={{display:'block', marginBottom:4, color:'#444'}}>About</strong>
                                        {community.description || "No description provided."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </>
    );
}