// Core React hooks, page routing utilities, and the UI emoji picker
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

/* Local Styles & Components */
import '../static/styles/Chat_youth.css';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { ExpandableText, InlineMessageEditor } from "../components/ChatUtils.jsx";
import { isImage, formatTime, useChatLogic } from "../components/ChatLogic.jsx";


/* ===========================================================================
   MAIN COMPONENT
=========================================================================== */
export default function YouthChat() {

    /* --- 1. Routing & Storage --- */
    const params = useParams();
    const communityId = params.communityId || params.id;
    const navigate = useNavigate();
    const storedUserId = localStorage.getItem("currentUserId");

    /* --- 2. State Management --- */
    const [inputText, setInputText] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);
    const [editMsgId, setEditMsgId] = useState(null);

    /* --- 3. References --- */
    const chatEndRef = useRef(null);

    /* --- 4. Chat Logic Hook --- */
    const {
        community, messages, loading, onlineCount, currentUser,
        sendMessage, deleteMessage, editMessage, joinCommunity
    } = useChatLogic(communityId);

    /* --- 5. Action Handlers --- */
    const handleSendMsg = async (textToSend = inputText) => {
        if (await sendMessage(textToSend)) {
            setInputText("");
            setShowEmojis(false);
        }
    };

    const handleSaveEdit = async (msgId, newContent) => {
        if (await editMessage(msgId, newContent)) {
            setEditMsgId(null);
        }
    };

    const handleDeleteMsg = async (msgId) => {
        if (window.confirm("Delete this message?")) {
            deleteMessage(msgId);
        }
    };

    const handleSendImage = () => {
        const url = prompt("Paste an image URL:");
        if (url) handleSendMsg(url);
    };

    /* --- 6. Auto-Scroll Effects --- */
    useEffect(() => {
        if (!loading && messages.length > 0) {
            chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [loading, messages.length]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* --- 7. UI Display Helpers --- */
    const chatName = community?.display_name || "Community";
    const chatIcon = community?.icon_url || community?.iconUrl;

    const getAvatarColor = (id) => {
        const colors = ['#5865F2', '#EB459E', '#FEE75C', '#57F287', '#ED4245'];
        return colors[id % colors.length] || '#5865F2';
    };

    /* ===========================================================================
       RENDER UI
    =========================================================================== */
    return (
        <>
            <NavBar />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

            <main style={{ position: 'fixed', top: '-16px', bottom: 0, left: 34, right: 0, display: 'flex', backgroundColor: '#313338' }}>
                <SideBar />

                <div className="discord-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* --- CHAT HEADER --- */}
                    <div className="discord-header" style={{ justifyContent: 'space-between', cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
                            <div className="header-icon-circle">
                                {chatIcon ? <img src={chatIcon} alt="Icon" className="header-icon-img"/> : <span>#</span>}
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span>{chatName} Chat</span>
                                <span style={{fontSize: '12px', color: '#23a559'}}>● {onlineCount} Online</span>
                            </div>
                        </div>
                        <button className="youth-switch-btn" onClick={() => navigate(`/community/${communityId}/messages`)}>
                            <span className="material-icons" style={{ fontSize: '0.1px' }}>old_standard</span>
                            Elderly Mode
                        </button>
                    </div>

                    {/* --- MESSAGES AREA --- */}
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

                                // Security & Identity Check
                                const authorId = msg.author?.user_id || msg.author?.userId || msg.author?.id || msg.author_id;
                                const myId = currentUser?.user_id || currentUser?.userId || currentUser?.id || storedUserId;
                                const isMe = myId != null && String(authorId) === String(myId);

                                return (
                                    <div
                                        key={msg.messageId}
                                        className="message-row"
                                        style={{ position: 'relative' }}
                                        onMouseEnter={() => setHoveredMsgId(msg.messageId)}
                                        onMouseLeave={() => setHoveredMsgId(null)}
                                    >
                                        <div className="avatar-circle" style={{ backgroundColor: getAvatarColor(authorId) }}>
                                            {(msg.author?.displayName || "U").charAt(0).toUpperCase()}
                                        </div>

                                        <div className="msg-content-col" style={{width: '100%'}}>
                                            <div className="msg-header">
                                                <span className="username">{msg.author?.displayName || "User"} {isMe ? '(You)' : ''}</span>
                                                <span className="timestamp">{formatTime(msg.created)}</span>
                                            </div>

                                            {/* Content Area: Edit Mode vs Normal Mode */}
                                            <div className="msg-text">
                                                {editMsgId === msg.messageId ? (
                                                    <InlineMessageEditor
                                                        initialText={msg.content}
                                                        theme="youth"
                                                        onSave={(newContent) => handleSaveEdit(msg.messageId, newContent)}
                                                        onCancel={() => setEditMsgId(null)}
                                                    />
                                                ) : (
                                                    isImage(msg.content) ?
                                                        <img src={msg.content} alt="sent" className="chat-image" /> :
                                                        <ExpandableText text={msg.content} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover Actions (Edit / Delete) */}
                                        {isMe && hoveredMsgId === msg.messageId && editMsgId !== msg.messageId && (
                                            <div className="youth-actions">
                                                <span className="material-icons" title="Edit" onClick={() => setEditMsgId(msg.messageId)}>edit</span>
                                                <span className="material-icons" title="Delete" style={{ color: '#ea4335' }} onClick={() => handleDeleteMsg(msg.messageId)}>delete</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef}/>
                    </div>

                    {/* --- CHAT FOOTER (INPUT AREA) --- */}
                    <div className="discord-input-area">
                         {showEmojis && (
                            <div className="emoji-picker-container">
                                <EmojiPicker onEmojiClick={(e) => setInputText(p => p + e.emoji)} theme="dark" height={350} width={300}/>
                            </div>
                        )}
                        <div className="input-wrapper">
                            <button className="icon-btn" onClick={handleSendImage} title="Add Image URL" style={{marginRight: '10px'}}>
                                <span className="material-icons">add_photo_alternate</span>
                            </button>
                            <input
                                type="text"
                                className="discord-input"
                                placeholder={`Message #${chatName}`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMsg()}
                            />
                            <div className="right-icons">
                                <button className="icon-btn" onClick={() => setShowEmojis(!showEmojis)}><span className="material-icons">sentiment_satisfied_alt</span></button>
                                <button className="icon-btn" onClick={() => handleSendMsg()}><span className="material-icons">send</span></button>
                            </div>
                        </div>
                    </div>

                    {/* --- YOUTH PROFILE OVERLAY --- */}
                    {showProfile && community && (
                        <div className="youth-profile-overlay" onClick={() => setShowProfile(false)}>
                            <div className="youth-profile-card" onClick={e => e.stopPropagation()}>
                                <div className="youth-profile-banner"></div>

                                <button className="youth-close-btn" onClick={() => setShowProfile(false)}>
                                    <span className="material-icons" style={{fontSize: 16}}>close</span>
                                </button>

                                <div className="youth-profile-avatar-wrapper">
                                    {chatIcon ? (
                                        <img src={chatIcon} alt="Icon" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <div style={{width:'100%', height:'100%', background:'#5865F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'white'}}>
                                            {chatName.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="youth-profile-content">
                                    <div className="youth-profile-title">{chatName}</div>
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