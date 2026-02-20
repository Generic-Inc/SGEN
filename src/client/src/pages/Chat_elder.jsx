// Core React hooks, page routing utilities, and the UI emoji picker
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

/* Local Styles & Components */
import '../static/styles/Chat_elder.css';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { ExpandableText, InlineMessageEditor } from "../components/ChatUtils.jsx";
import { isImage, formatTime, useChatLogic } from "../components/ChatLogic.jsx";


/* ===========================================================================
   MAIN COMPONENT
=========================================================================== */
export default function ElderlyChat() {

    /* --- 1. Routing & Storage --- */
    const { communityId } = useParams();
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
        community, messages, loading, currentUser,
        sendMessage, editMessage, deleteMessage, onlineCount, joinCommunity
    } = useChatLogic(communityId);

    /* --- 5. Action Handlers --- */
    const handleSendMsg = async (textToSend = inputText) => {
        const success = await sendMessage(textToSend);
        if (success) {
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
        if (window.confirm("Are you sure you want to delete this message?")) {
            await deleteMessage(msgId);
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
        const container = chatEndRef.current?.parentElement;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    /* --- 7. UI Display Variables --- */
    const elderName = community?.display_name || "Community";
    const elderIcon = community?.icon_url || community?.iconUrl;

    /* ===========================================================================
       RENDER UI
    =========================================================================== */
    return (
        <>
            <NavBar />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>

            <main style={{position: 'fixed', top: '-50px', bottom: 0, left: 0, right: 0, display: 'flex'}}>
                <SideBar />

                <div className="main-container">
                    <div className="chat-box">

                        {/* --- CHAT HEADER --- */}
                        <div className="chat-header">
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
                                <div className="header-icon-circle">
                                    {elderIcon ? <img src={elderIcon} alt="Icon" className="header-icon-img"/> : <span>#</span>}
                                </div>
                                <div style={{display:'flex', flexDirection:'column'}}>
                                    <strong>{elderName} Chat</strong>
                                    <span style={{fontSize:'14px', color: '#4caf50', fontWeight:'normal'}}>● {onlineCount} Online</span>
                                </div>
                            </div>
                            <button className="switch-ui-btn" onClick={(e) => { e.stopPropagation(); navigate(`/community/${communityId}/messages/youth`); }}>
                                Switch to Youth UI
                            </button>
                        </div>

                        {/* --- MESSAGES AREA --- */}
                        <div className="chat-messages-area">
                            {loading ? (
                                <div style={{textAlign: 'center', color: '#999', marginTop: 10}}>Loading...</div>
                            ) : messages.length === 0 ? (
                                <div style={{textAlign: 'center', marginTop: 50}}>
                                    <p style={{color: '#666'}}>No messages found. Are you a member?</p>
                                    <button className="text-btn" style={{fontSize: '16px', fontWeight: 'bold'}} onClick={joinCommunity}>Join this Community</button>
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
                                            className={`msg-bubble ${isMe ? 'msg-right' : 'msg-left'}`}
                                            onMouseEnter={() => setHoveredMsgId(msg.messageId)}
                                            onMouseLeave={() => setHoveredMsgId(null)}
                                        >
                                            <span className="msg-sender">{msg.author?.displayName || "User"} {isMe ? '(You)' : ''}</span>

                                            {/* Content Area: Edit Mode vs Normal Mode */}
                                            {editMsgId === msg.messageId ? (
                                                <InlineMessageEditor
                                                    initialText={msg.content}
                                                    theme="elder"
                                                    onSave={(newContent) => handleSaveEdit(msg.messageId, newContent)}
                                                    onCancel={() => setEditMsgId(null)}
                                                />
                                            ) : (
                                                <>
                                                    {isImage(msg.content) ?
                                                        <img src={msg.content} alt="sent" className="chat-image" referrerPolicy="no-referrer" /> :
                                                        <ExpandableText text={msg.content} />
                                                    }
                                                </>
                                            )}

                                            {/* Message Footer: Timestamp & Actions */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                <span className="timestamp">{formatTime(msg.created)}</span>
                                                {isMe && hoveredMsgId === msg.messageId && editMsgId !== msg.messageId && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="icon-only-btn edit" onClick={() => setEditMsgId(msg.messageId)} title="Edit">
                                                            <span className="material-icons">edit</span>
                                                        </button>
                                                        <button className="icon-only-btn delete" onClick={() => handleDeleteMsg(msg.messageId)} title="Delete">
                                                            <span className="material-icons">delete_outline</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} style={{ height: '1px' }}/>
                        </div>

                        {/* --- CHAT FOOTER (INPUT AREA) --- */}
                        <div className="chat-footer">
                            <button className="icon-btn" onClick={handleSendImage} title="Add Image URL"><span className="material-icons">add_photo_alternate</span></button>
                            <button className="icon-btn" onClick={() => setShowEmojis(!showEmojis)}><span className="material-icons">sentiment_satisfied_alt</span></button>

                            {showEmojis && (
                                <div className="emoji-picker-container">
                                    <EmojiPicker onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} height={350} width={300}/>
                                </div>
                            )}

                            <input type="text" className="chat-input" placeholder="Type a message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMsg()} />
                            <button className="icon-btn" style={{color: '#25d366'}} onClick={() => handleSendMsg()}><span className="material-icons">send</span></button>
                        </div>
                    </div>

                    {/* --- ELDER PROFILE OVERLAY --- */}
                    {showProfile && community && (
                        <div className="elder-profile-overlay" onClick={() => setShowProfile(false)}>
                            <div className="elder-profile-card" onClick={e => e.stopPropagation()}>
                                <div className="elder-profile-banner"></div>

                                <button className="elder-close-btn" onClick={() => setShowProfile(false)}>
                                    <span className="material-icons" style={{fontSize: 18}}>close</span>
                                </button>

                                <div className="elder-profile-avatar-wrapper">
                                    {elderIcon ? <img src={elderIcon} alt="Icon" /> : <div style={{fontSize: 24, fontWeight: 'bold', color: '#888'}}>#</div>}
                                </div>

                                <div className="elder-profile-content">
                                    <div className="elder-profile-title">{elderName}</div>
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