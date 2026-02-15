/* Import React tools and external libraries */
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

/* Import local styles and components */
import '../static/styles/Chat_elder.css';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { ExpandableText } from "../components/ChatUtils.jsx";
import { isImage, formatTime, useChatLogic } from "../components/ChatLogic.jsx";

/* Define server address and current user ID */
const API_URL = "http://127.0.0.1:5000/api";
const CURRENT_USER_ID = 1; // Elder user ID

export default function ChatPage() {
    /* Get URL parameters and setup local states */
    const { communityId } = useParams();
    const [inputText, setInputText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const messagesEndRef = useRef(null);

    /* Use shared custom hook for chat operations */
    const { community, messages, loading, sendMessage, fetchMessages } = useChatLogic(API_URL, communityId, CURRENT_USER_ID);

    /* Function to handle sending messages and clearing input */
    const handleSend = async (textToSend = inputText) => {
        const success = await sendMessage(textToSend);
        if (success) {
            setInputText("");
            setShowEmojiPicker(false);
        }
    };

    /* Prompt user for image URL and send it */
    const handleImageLink = () => {
        const url = prompt("Paste an image URL:");
        if (url) handleSend(url);
    };

    /* Set up automatic message refreshing every 3 seconds */
    useEffect(() => {
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    /* Initial scroll to bottom on page reload */
    useEffect(() => {
        if (!loading && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [loading]);

    /* Conditional smooth scroll for new incoming messages */
    useEffect(() => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [messages]);

    /* Prepare community display details */
    const displayName = community?.display_name || "Loading...";
    const iconUrl = community?.icon_url || community?.iconUrl;

    return (
        <>
            {/* Main navigation and external icons */}
            <NavBar />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

            {/* Main layout container with fixed positioning */}
            <main style={{ position: 'fixed', top: '60px', bottom: 0, left: 0, right: 0, display: 'flex', overflow: 'hidden' }}>
                <SideBar />
                <div className="main-container">
                    <div className="chat-box">
                        {/* Header bar that toggles community profile */}
                        <div className="chat-header" onClick={() => setShowProfile(true)}>
                            <div className="header-icon-circle">
                                {iconUrl ? <img src={iconUrl} alt="Icon" className="header-icon-img"/> : <span>#</span>}
                            </div>
                            <strong>{displayName} Chat</strong>
                        </div>

                        {/* Scrollable message area with conditional bubble alignment */}
                        <div className="chat-messages-area">
                            {loading && <div style={{textAlign: 'center', color: '#999', marginTop: 10}}>Loading...</div>}
                            {messages.map(msg => {
                                const isMe = String(msg.author?.userId || msg.author_id) === String(CURRENT_USER_ID);
                                return (
                                    <div key={msg.messageId} className={`msg-bubble ${isMe ? 'msg-right' : 'msg-left'}`}>
                                        <span className="msg-sender">{msg.author?.displayName || "User"} {isMe ? '(You)' : ''}</span>
                                        {/* Render images or text content */}
                                        {isImage(msg.content) ?
                                            <img src={msg.content} alt="sent" className="chat-image" referrerPolicy="no-referrer" /> :
                                            <ExpandableText text={msg.content} />
                                        }
                                        <span className="timestamp">{formatTime(msg.created)}</span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} style={{ height: '1px' }}/>
                        </div>

                        {/* Footer area with input and action buttons */}
                        <div className="chat-footer">
                            <button className="icon-btn" onClick={handleImageLink} title="Add Image URL"><span className="material-icons">add_photo_alternate</span></button>
                            <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><span className="material-icons">sentiment_satisfied_alt</span></button>
                            {showEmojiPicker && <div className="emoji-picker-container"><EmojiPicker onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} height={350} width={300}/></div>}
                            <input type="text" className="chat-input" placeholder="Type a message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                            <button className="icon-btn" style={{color: '#25d366'}} onClick={() => handleSend()}><span className="material-icons">send</span></button>
                        </div>
                    </div>

                    {/* Elderly profile popup modal */}
                    {showProfile && community && (
                        <div className="elder-profile-overlay" onClick={() => setShowProfile(false)}>
                            <div className="elder-profile-card" onClick={e => e.stopPropagation()}>
                                <div className="elder-profile-banner"></div>
                                <button className="elder-close-btn" onClick={() => setShowProfile(false)}><span className="material-icons" style={{fontSize: 18}}>close</span></button>
                                <div className="elder-profile-avatar-wrapper">
                                    {iconUrl ? <img src={iconUrl} alt="Icon" /> : <div style={{fontSize: 24, fontWeight: 'bold', color: '#888'}}>#</div>}
                                </div>
                                <div className="elder-profile-content">
                                    <div className="elder-profile-title">{displayName}</div>
                                    <div className="elder-profile-desc-box">
                                        <strong style={{display:'block', marginBottom:4, color:'#111b21'}}>About</strong>
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