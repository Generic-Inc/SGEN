// ==========================================
// 1. IMPORTS
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
// ✅ Import shared tools
import { isImage, formatTime, ExpandableText } from "../components/ChatUtils.jsx";

// ==========================================
// 2. CONFIGURATION
// ==========================================
const API_URL = "http://127.0.0.1:5000/api";
const CURRENT_USER_ID = 1;

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function ChatPageDiscord() {

    const { communityId } = useParams();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [community, setCommunity] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    const messagesEndRef = useRef(null);

    // Helper: Avatar Color
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
                    setCommunity(data);
                } else {
                    setCommunity({ display_name: "greenery walk", icon_url: null, description: "Community not found" });
                }
            } catch (error) {
                setCommunity({ display_name: "greenery walk", icon_url: null, description: "Network error" });
            }
        };
        if (communityId) fetchCommunityInfo();
    }, [communityId]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/community/${communityId}/messages`, { credentials: 'include' });
            if (!response.ok) { setMessages([]); setLoading(false); return; }
            const data = await response.json();
            if (data.messages) setMessages(data.messages);
            setLoading(false);
        } catch (error) { console.error("Error fetching messages:", error); }
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

    const handleImageLink = () => {
        const url = prompt("Paste an image URL (ending in .jpg, .png, etc):");
        if (url) {
            handleSendMessage(url);
        }
    };

    useEffect(() => {
        setLoading(true); setMessages([]); fetchMessages();
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
    // 5. RENDER
    // ==========================================

    const displayName = community ? (community.display_name || community.community_name) : "Loading...";
    const iconUrl = community?.icon_url || community?.iconUrl;

    return (
        <>
            <NavBar />
            <main style={{
                position: 'fixed', top: '80px', bottom: 0, left: 0, right: 0,
                display: 'flex', overflow: 'hidden', backgroundColor: '#313338'
            }}>
                <SideBar />

                <div className="discord-container" style={{
                    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
                }}>
                    <style>{`
                        * { box-sizing: border-box; }
                        .discord-container { background-color: #313338; color: #dbdee1; font-family: 'gg sans', sans-serif; }
                        
                        /* Header */
                        .discord-header { 
                            height: 48px; 
                            border-bottom: 1px solid #26272d; /* Fixed: borderBottom */
                            display: flex; 
                            align-items: center; /* Fixed: alignItems */
                            padding: 0 16px; 
                            font-size: 16px; /* Fixed: fontSize */
                            font-weight: bold; /* Fixed: fontWeight */
                            color: #f2f3f5; 
                            box-shadow: 0 1px 2px rgba(0,0,0,0.2); /* Fixed: boxShadow */
                        }
                        .header-icon-circle { 
                            width: 28px; height: 28px; border-radius: 50%; 
                            background-color: #5865F2; margin-right: 10px; 
                            display: flex; align-items: center; justify-content: center; 
                            cursor: pointer; overflow: hidden; color: white; 
                            font-size: 14px; transition: transform 0.2s; 
                        }
                        .header-icon-circle:hover { transform: scale(1.1); }
                        .header-icon-img { width: 100%; height: 100%; object-fit: cover; }
                        
                        /* Messages */
                        .discord-messages { 
                            flex: 1; 
                            overflow-y: auto; 
                            padding: 20px 0; 
                            display: flex; 
                            flex-direction: column; /* ✅ FIXED: was flexDirection */
                        }
                        .message-row { 
                            display: flex; 
                            padding: 2px 16px; 
                            margin-top: 10px; /* Fixed: marginTop */
                            align-items: flex-start; /* Fixed: alignItems */
                        }
                        .message-row:hover { background-color: rgba(2, 2, 2, 0.06); } 
                        
                        .avatar-circle { 
                            width: 40px; height: 40px; border-radius: 50%; 
                            margin-right: 16px; display: flex; align-items: center; 
                            justify-content: center; color: white; font-weight: bold; 
                            font-size: 18px; flex-shrink: 0; 
                        }
                        .msg-content-col { 
                            display: flex; 
                            flex-direction: column; /* ✅ FIXED */
                            justify-content: center; 
                            max-width: 90%; 
                        }
                        .msg-header { 
                            display: flex; 
                            align-items: baseline; /* Fixed: alignItems */
                            gap: 8px; 
                            margin-bottom: 2px; /* Fixed: marginBottom */
                        }
                        .username { font-weight: 500; color: #f2f3f5; font-size: 16px; cursor: pointer; }
                        .timestamp { font-size: 12px; color: #949BA4; }
                        
                        .msg-text { 
                            font-size: 15px; /* Fixed: fontSize */
                            color: #dbdee1; 
                            line-height: 1.375rem; /* Fixed: lineHeight */
                            white-space: pre-wrap; 
                            word-wrap: break-word; 
                            overflow-wrap: anywhere; /* ✅ FIXED: Prevents long strings from breaking layout */
                        }

                        /* Image Styling */
                        .chat-image {
                            max-width: 100%; max-height: 350px;
                            width: auto; height: auto;
                            border-radius: 8px; margin-top: 6px; display: block;
                        }

                        /* Input Area */
                        .discord-input-area { padding: 0 16px 24px 16px; background-color: #313338; }
                        .input-wrapper { 
                            background-color: #383a40; 
                            border-radius: 8px; 
                            display: flex; 
                            align-items: center; /* Fixed: alignItems */
                            padding: 0 16px; 
                        }
                        .plus-btn { color: #b5bac1; background: none; border: none; cursor: pointer; margin-right: 12px; display: flex; align-items: center; }
                        .discord-input { flex: 1; background: transparent; border: none; color: #dbdee1; padding: 12px 0; outline: none; font-size: 15px; }
                        .right-icons { display: flex; gap: 12px; }
                        .icon-btn { color: #b5bac1; cursor: pointer; background: none; border: none; display: flex; align-items: center; }
                        .icon-btn:hover { color: #f2f3f5; }
                        .emoji-picker-container { position: absolute; bottom: 80px; right: 20px; z-index: 100; }
                        
                        /* Modal */
                        .profile-modal-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                        .profile-modal { width: 350px; background-color: #111214; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.24); position: relative; }
                        .profile-banner { height: 60px; background-color: #5865F2; }
                        .profile-avatar-wrapper { position: absolute; top: 20px; left: 20px; width: 80px; height: 80px; border-radius: 50%; border: 6px solid #111214; background-color: #111214; overflow: hidden; display: flex; align-items: center; justify-content: center; }
                        .profile-content { margin-top: 40px; padding: 16px; background-color: #111214; }
                        .profile-title { font-size: 20px; font-weight: bold; color: white; margin-bottom: 4px; }
                        .profile-desc-box { background-color: #2b2d31; padding: 12px; border-radius: 4px; font-size: 14px; color: #dbdee1; line-height: 1.4; }
                        .close-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                    `}</style>
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

                    <div className="discord-header">
                        <div className="header-icon-circle" onClick={() => setShowProfile(true)} title="View Profile">
                            {iconUrl ? <img src={iconUrl} alt="Icon" className="header-icon-img"/> : <span>#</span>}
                        </div>
                        {displayName} Chat
                    </div>

                    <div className="discord-messages">
                        {loading && <div style={{textAlign: 'center', color: '#949BA4', marginTop: 20}}>Loading...</div>}
                        {messages.map(msg => {
                            const msgAuthorId = msg.author ? msg.author.userId : (msg.author_id || 0);
                            const displayName = msg.author ? msg.author.displayName : "User " + msgAuthorId;
                            return (
                                <div key={msg.messageId} className="message-row">
                                    <div className="avatar-circle" style={{backgroundColor: getAvatarColor(msgAuthorId)}}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="msg-content-col">
                                        <div className="msg-header">
                                            <span className="username">{displayName}</span>
                                            <span className="timestamp">{formatTime(msg.created)}</span>
                                        </div>
                                        <div className="msg-text">
                                            {isImage(msg.content) ? (
                                                <img src={msg.content} alt="sent" className="chat-image" referrerPolicy="no-referrer"/>
                                            ) : (
                                                <ExpandableText text={msg.content} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef}/>
                    </div>

                    <div className="discord-input-area">
                        {showEmojiPicker && (
                            <div className="emoji-picker-container">
                                <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={350} width={300}/>
                            </div>
                        )}
                        <div className="input-wrapper">
                            <button className="plus-btn" onClick={handleImageLink}>
                                <span className="material-icons">add_circle</span>
                            </button>

                            <input type="text" className="discord-input" placeholder={`Message #${displayName}`} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress}/>
                            <div className="right-icons">
                                <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><span className="material-icons">sentiment_satisfied_alt</span></button>
                                <button className="icon-btn" onClick={() => handleSendMessage()} style={{color: inputText.trim() ? '#5865F2' : '#b5bac1'}}><span className="material-icons">send</span></button>
                            </div>
                        </div>
                    </div>

                    {showProfile && community && (
                        <div className="profile-modal-overlay" onClick={() => setShowProfile(false)}>
                            <div className="profile-modal" onClick={e => e.stopPropagation()}>
                                <div className="profile-banner"></div>
                                <button className="close-btn" onClick={() => setShowProfile(false)}><span className="material-icons" style={{fontSize: 16}}>close</span></button>
                                <div className="profile-avatar-wrapper">
                                    {iconUrl ? <img src={iconUrl} alt="Community Icon" /> : <div style={{width:'100%', height:'100%', background:'#5865F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'white', fontWeight:'bold'}}>{displayName.charAt(0)}</div>}
                                </div>
                                <div className="profile-content">
                                    <div className="profile-title">{displayName}</div>
                                    <div className="profile-desc-box">
                                        <strong>About</strong><br/>
                                        <span style={{color:'#b5bac1'}}>{community.description || "No description provided."}</span>
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