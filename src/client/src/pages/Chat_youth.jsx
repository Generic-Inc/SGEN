/* src/pages/Chat_youth.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import '../static/styles/Chat_youth.css';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { ExpandableText } from "../components/ChatUtils.jsx";
import { isImage, formatTime, useChatLogic } from "../components/ChatLogic.jsx";

export default function ChatPageYouth() {
    // 1. ROBUST PARAMETER HANDLING
    // Extract communityId from the URL regardless of the route key
    const params = useParams();
    const communityId = params.communityId || params.id;

    // 2. GET USER ID
    // Retrieve the ID saved during login to identify "Me"
    const currentUserId = localStorage.getItem("currentUserId");

    const [inputText, setInputText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const messagesEndRef = useRef(null);

    // 3. CALL LOGIC
    // Use the shared hook for all backend communications
    const {
        community, messages, loading, onlineCount,
        sendMessage, deleteMessage, editMessage, joinCommunity
    } = useChatLogic(communityId);

    const handleSend = async () => {
        if (await sendMessage(inputText)) {
            setInputText("");
            setShowEmojiPicker(false);
        }
    };

    // RESTORED: Image Handler
    const handleImageLink = () => {
        const url = prompt("Paste an image URL:");
        if (url) {
            sendMessage(url);
        }
    };

    // Edit/Delete Handlers
    const handleEdit = (msg) => {
        const newText = prompt("Edit your message:", msg.content);
        if (newText && newText !== msg.content) {
            editMessage(msg.messageId, newText);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Delete this message?")) {
            deleteMessage(id);
        }
    };

    useEffect(() => {
        if (!loading && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [loading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const displayName = community?.display_name || "Community";
    const iconUrl = community?.icon_url || community?.iconUrl;

    const getAvatarColor = (id) => {
        const colors = ['#5865F2', '#EB459E', '#FEE75C', '#57F287', '#ED4245'];
        return colors[id % colors.length] || '#5865F2';
    };

    return (
        <>
            <NavBar />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

            {/* Layout Fix: set top to 80px to prevent NavBar overlap */}
            <main style={{ position: 'fixed', top: '-16px', bottom: 0, left: 34, right: 0, display: 'flex', backgroundColor: '#313338' }}>
                <SideBar />
                <div className="discord-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* Header */}
                    <div className="discord-header" onClick={() => setShowProfile(true)}>
                        <div className="header-icon-circle">
                            {iconUrl ? <img src={iconUrl} alt="Icon" className="header-icon-img"/> : <span>#</span>}
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span>{displayName} Chat</span>
                            <span style={{fontSize: '12px', color: '#23a559'}}>● {onlineCount} Online</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="discord-messages">
                        {loading ? (
                            <div style={{textAlign: 'center', color: '#949BA4', marginTop: 20}}>Loading...</div>
                        ) : messages.length === 0 ? (
                             <div style={{textAlign: 'center', marginTop: 50, color: '#dbdee1'}}>
                                <p>No messages yet.</p>
                                <button className="icon-btn" style={{margin:'0 auto', color: '#5865F2'}} onClick={joinCommunity}>Join Community</button>
                            </div>
                        ) : (
                            messages.map(msg => {
                                // Standardize the author ID extraction
                                const authorId = msg.author?.userId || msg.author_id;
                                const isMe = String(authorId) === String(currentUserId);

                                return (
                                    <div key={msg.messageId} className="message-row" style={{ position: 'relative' }}>
                                        <div className="avatar-circle" style={{ backgroundColor: getAvatarColor(authorId) }}>
                                            {(msg.author?.displayName || "U").charAt(0).toUpperCase()}
                                        </div>

                                        <div className="msg-content-col" style={{width: '100%'}}>
                                            <div className="msg-header">
                                                <span className="username">{msg.author?.displayName || "User"} {isMe ? '(You)' : ''}</span>
                                                <span className="timestamp">{formatTime(msg.created)}</span>
                                            </div>
                                            <div className="msg-text">
                                                {isImage(msg.content) ?
                                                    <img src={msg.content} alt="sent" className="chat-image" /> :
                                                    <ExpandableText text={msg.content} />
                                                }
                                            </div>
                                        </div>

                                        {/* Discord-style Hover Actions */}
                                        {isMe && (
                                            <div className="youth-actions">
                                                <span className="material-icons" title="Edit" onClick={() => handleEdit(msg)}>edit</span>
                                                <span className="material-icons" title="Delete" style={{ color: '#ea4335' }} onClick={() => handleDelete(msg.messageId)}>delete</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Input Area */}
                    <div className="discord-input-area">
                         {showEmojiPicker && (
                            <div className="emoji-picker-container">
                                <EmojiPicker onEmojiClick={(e) => setInputText(p => p + e.emoji)} theme="dark" height={350} width={300}/>
                            </div>
                        )}
                        <div className="input-wrapper">
                            {/* RESTORED: Image Button */}
                            <button className="icon-btn" onClick={handleImageLink} title="Add Image URL" style={{marginRight: '10px'}}>
                                <span className="material-icons">add_photo_alternate</span>
                            </button>

                            <input
                                type="text"
                                className="discord-input"
                                placeholder={`Message #${displayName}`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <div className="right-icons">
                                <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><span className="material-icons">sentiment_satisfied_alt</span></button>
                                <button className="icon-btn" onClick={handleSend}><span className="material-icons">send</span></button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Modal */}
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