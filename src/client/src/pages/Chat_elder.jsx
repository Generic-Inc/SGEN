/* Import React tools and external libraries */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';


/* Import local styles and components */
import '../static/styles/Chat_elder.css';
import '../static/styles/App.css';
import NavBar from "../components/nav_bar.jsx";
import SideBar from "../components/side_bar.jsx";
import { ExpandableText } from "../components/ChatUtils.jsx";
import { isImage, formatTime, useChatLogic } from "../components/ChatLogic.jsx";

// REMOVED: API_URL and CURRENT_USER_ID are no longer needed.
// The backend now handles identity via the secure token cookie.

export default function ChatPage() {
    /* Get URL parameters and setup local states */
    const { communityId } = useParams();
    const navigate = useNavigate();
    const [inputText, setInputText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    /* NEW: States for editing messages */
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    const messagesEndRef = useRef(null);

    /* Use shared custom hook for chat operations */
    // Note: Removed extra arguments. Only communityId is needed now.
    const {
        community,
        messages,
        loading,
        sendMessage,
        editMessage,   // Added
        deleteMessage, // Added
        onlineCount,
        joinCommunity  // Added for "Forbidden" handling
    } = useChatLogic(communityId);

    /* Function to handle sending messages */
    const handleSend = async (textToSend = inputText) => {
        const success = await sendMessage(textToSend);
        if (success) {
            setInputText("");
            setShowEmojiPicker(false);
        }
    };

    /* NEW: Handle Edit Submission */
    const handleSaveEdit = async (messageId) => {
        if (await editMessage(messageId, editText)) {
            setEditingId(null);
            setEditText("");
        }
    };

    /* NEW: Handle Delete Confirmation */
    const handleDelete = async (messageId) => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            await deleteMessage(messageId);
        }
    };

    const handleImageLink = () => {
        const url = prompt("Paste an image URL:");
        if (url) handleSend(url);
    };

    useEffect(() => {
        if (!loading && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [loading, messages.length]);

    useEffect(() => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [messages]);

    const displayName = community?.display_name || "Community";
    const iconUrl = community?.icon_url || community?.iconUrl;

    return (
        <>
            <NavBar />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>


            <main style={{position: 'fixed', top: '-50px', bottom: 0, left: 0, right: 0, display: 'flex'}}>
                <SideBar />
                <div className="main-container">
                    <div className="chat-box">
                        <div className="chat-header">
    {/* NEW WRAPPER: Group 1 (Left Side) */}
    <div style={{ display: 'flex', alignItems: 'center' }} onClick={() => setShowProfile(true)}>
        <div className="header-icon-circle">
            {iconUrl ? <img src={iconUrl} alt="Icon" className="header-icon-img"/> : <span>#</span>}
        </div>
        <div style={{display:'flex', flexDirection:'column'}}>
            <strong>{displayName} Chat</strong>
            <span style={{fontSize:'14px', color: '#4caf50', fontWeight:'normal'}}>
                ● {onlineCount} Online
            </span>
        </div>
    </div>

    {/* Group 2 (Right Side) */}
    <button
        className="switch-ui-btn"
        onClick={(e) => {
            e.stopPropagation();
            navigate(`/community/${communityId}/messages/youth`);
        }}
    >
        Switch to Youth UI
    </button>
</div>

                        <div className="chat-messages-area">
                            {/* Improved Loading / Empty State */}
                            {loading ? (
                                <div style={{textAlign: 'center', color: '#999', marginTop: 10}}>Loading...</div>
                            ) : messages.length === 0 ? (
                                <div style={{textAlign: 'center', marginTop: 50}}>
                                    <p style={{color: '#666'}}>No messages found. Are you a member?</p>
                                    <button className="text-btn" style={{fontSize: '16px', fontWeight: 'bold'}} onClick={joinCommunity}>
                                        Join this Community
                                    </button>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    /* SECURITY: Check ownership dynamically.
                                       Ideally, compare msg.author.userId with your logged-in user's ID from a global context.
                                       For now, we check if the message author exists. */
                                    const isMe = msg.author?.userId === community?.owner?.userId; // Placeholder logic until global user state is ready

                                    return (
                                        <div key={msg.messageId} className={`msg-bubble ${isMe ? 'msg-right' : 'msg-left'}`}>
                                            <span className="msg-sender">{msg.author?.displayName || "User"} {isMe ? '(You)' : ''}</span>

                                            {/* EDIT MODE UI */}
                                            {editingId === msg.messageId ? (
                                                <div className="edit-box" style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                                    <input
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="chat-input"
                                                        style={{width: '100%', marginBottom: '5px'}}
                                                        autoFocus
                                                    />
                                                    <div style={{display: 'flex', gap: '8px'}}>
                                                        <button className="text-btn" onClick={() => handleSaveEdit(msg.messageId)}>Save</button>
                                                        <button className="text-btn" onClick={() => setEditingId(null)}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* NORMAL VIEW UI */
                                                <>
                                                    {isImage(msg.content) ?
                                                        <img src={msg.content} alt="sent" className="chat-image" referrerPolicy="no-referrer" /> :
                                                        <ExpandableText text={msg.content} />
                                                    }
                                                </>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
    <span className="timestamp">{formatTime(msg.created)}</span>

    {/* Icons only, aligned with the timestamp */}
    {isMe && editingId !== msg.messageId && (
        <div style={{ display: 'flex', gap: '8px' }}>
            <button
                className="icon-only-btn edit"
                onClick={() => { setEditingId(msg.messageId); setEditText(msg.content); }}
                title="Edit"
            >
                <span className="material-icons">edit</span>
            </button>
            <button
                className="icon-only-btn delete"
                onClick={() => handleDelete(msg.messageId)}
                title="Delete"
            >
                <span className="material-icons">delete_outline</span>
            </button>
        </div>
    )}
</div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} style={{ height: '1px' }}/>
                        </div>

                        <div className="chat-footer">
                            <button className="icon-btn" onClick={handleImageLink} title="Add Image URL"><span className="material-icons">add_photo_alternate</span></button>
                            <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><span className="material-icons">sentiment_satisfied_alt</span></button>
                            {showEmojiPicker && <div className="emoji-picker-container"><EmojiPicker onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} height={350} width={300}/></div>}
                            <input type="text" className="chat-input" placeholder="Type a message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                            <button className="icon-btn" style={{color: '#25d366'}} onClick={() => handleSend()}><span className="material-icons">send</span></button>
                        </div>
                    </div>

                    {/* FIXED: showProfile used in conditional check to fix ESLint error */}
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