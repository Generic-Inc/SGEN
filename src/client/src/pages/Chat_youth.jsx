/* Import React tools and external libraries */
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

/* Import local styles and components */
import '../static/styles/Chat_youth.css';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { ExpandableText } from "../components/ChatUtils.jsx";
import { isImage, formatTime, useChatLogic } from "../components/ChatLogic.jsx";

/* Define server address and current user ID */
const API_URL = "http://127.0.0.1:5000/api";
const CURRENT_USER_ID = 2; // Youth user ID

export default function ChatPageYouth() {
    /* Get URL parameters and setup local states */
    const { communityId } = useParams();
    const [inputText, setInputText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const messagesEndRef = useRef(null);

    /* Use shared custom hook for chat operations */
    const { community, messages, loading, sendMessage, fetchMessages } = useChatLogic(API_URL, communityId, CURRENT_USER_ID);

    /* Function to handle sending messages and clearing input */
    const handleSend = async (text = inputText) => {
        if (await sendMessage(text)) {
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

    /* Handle emoji selection and enter key press */
    const onEmojiClick = (emojiObject) => setInputText(prev => prev + emojiObject.emoji);
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleSend(); };

    /* Assign random colors to user avatars */
    const getAvatarColor = (id) => {
        const colors = ['#5865F2', '#EB459E', '#FEE75C', '#57F287', '#ED4245'];
        return colors[id % colors.length] || '#5865F2';
    };

    /* Prepare community display details */
    const displayName = community?.display_name || "Loading...";
    const iconUrl = community?.icon_url || community?.iconUrl;

    return (
        <>
            {/* Main navigation and external icons */}
            <NavBar />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

            {/* Main layout container with sidebar and chat area */}
            <main style={{ position: 'fixed', top: '80px', bottom: 0, left: 0, right: 0, display: 'flex', overflow: 'hidden', backgroundColor: '#313338' }}>
                <SideBar />
                <div className="discord-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

                    {/* Chat header that toggles profile modal */}
                    <div className="discord-header" onClick={() => setShowProfile(true)}>
                        <div className="header-icon-circle">
                            {iconUrl ? <img src={iconUrl} alt="Icon" className="header-icon-img"/> : <span>#</span>}
                        </div>
                        {displayName} Chat
                    </div>

                    {/* Scrollable message list rendering */}
                    <div className="discord-messages">
                        {loading && <div style={{textAlign: 'center', color: '#949BA4', marginTop: 20}}>Loading...</div>}
                        {messages.map(msg => {
                            const authorId = msg.author?.userId || msg.author_id || 0;
                            const name = msg.author?.displayName || "User " + authorId;
                            return (
                                <div key={msg.messageId} className="message-row">
                                    <div className="avatar-circle" style={{backgroundColor: getAvatarColor(authorId)}}>{name.charAt(0).toUpperCase()}</div>
                                    <div className="msg-content-col">
                                        <div className="msg-header">
                                            <span className="username">{name}</span>
                                            <span className="timestamp">{formatTime(msg.created)}</span>
                                        </div>
                                        <div className="msg-text">
                                            {/* Render images or text based on content type */}
                                            {isImage(msg.content) ?
                                                <img src={msg.content} alt="sent" className="chat-image" referrerPolicy="no-referrer"/> :
                                                <ExpandableText text={msg.content} />
                                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Bottom input area with emoji and send buttons */}
                    <div className="discord-input-area">
                        {showEmojiPicker && (
                            <div className="emoji-picker-container">
                                <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={350} width={300}/>
                            </div>
                        )}
                        <div className="input-wrapper">
                            <button className="plus-btn" onClick={handleImageLink}>
                                <span className="material-icons">add_photo_alternate</span>
                            </button>
                            <input
                                type="text"
                                className="discord-input"
                                placeholder={`Message #${displayName}`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <div className="right-icons">
                                <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                    <span className="material-icons">sentiment_satisfied_alt</span>
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={() => handleSend()}
                                    style={{color: inputText.trim() ? '#5865F2' : '#b5bac1'}}
                                >
                                    <span className="material-icons">send</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Community profile popup modal */}
                    {showProfile && community && (
                        <div className="youth-profile-overlay" onClick={() => setShowProfile(false)}>
                            <div className="youth-profile-card" onClick={e => e.stopPropagation()}>
                                <div className="youth-profile-banner"></div>

                                <button className="youth-close-btn" onClick={() => setShowProfile(false)}>
                                    <span className="material-icons" style={{fontSize: 16}}>close</span>
                                </button>

                                <div className="youth-profile-avatar-wrapper">
                                    {iconUrl ? (
                                        <img src={iconUrl} alt="Icon" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <div style={{width:'100%', height:'100%', background:'#5865F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'white'}}>
                                            {displayName.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="youth-profile-content">
                                    <div className="youth-profile-title">{displayName}</div>
                                    <div className="youth-profile-desc-box">
                                        <strong style={{color: '#f2f3f5'}}>About</strong><br/>
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