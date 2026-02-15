import { useState } from "react";
import { postData, fetchData } from "../../static/api";
import CommentItem from "./comment_item";
import "../../static/styles/community.css";

function formatTimeAgo(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 0) return "Just now";

    if (diffInSeconds < 60) {
        return "Just now";
    }
    if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m ago`;
    }
    if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }
    if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    if (diffInSeconds < 31536000) {
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PostCard({ post, currentUser, onDelete, view }) {
    const authorObj = post.author || {};
    const authorName = authorObj.displayName || authorObj.display_name || authorObj.name || post.author_name || "Unknown";
    const authorAvatar = authorObj.avatarUrl || authorObj.avatar_url || post.author_avatar || "https://placehold.co/40";

    const currentUserId = currentUser?.userId || currentUser?.user_id;
    const postAuthorId = authorObj.userId || authorObj.user_id || post.author_id;

    const [content, setContent] = useState(post.content || post.description || "");
    const [modifiedAt, setModifiedAt] = useState(post.modified || post.created);
    const createdAt = post.created;

    const postImage = post.image_url || post.imageUrl || null;

    const displayCreated = formatTimeAgo(createdAt);
    const displayEdited = formatTimeAgo(modifiedAt);

    const communityId = post.communityId || post.community_id;
    const postId = post.postId || post.post_id;
    const communityName = post.communityName || post.community_name || null;

    const [likeCount, setLikeCount] = useState(post.likeCount || post.like_count || 0);
    const [isLiked, setIsLiked] = useState(post.isLiked || post.is_liked || false);
    const [commentCount, setCommentCount] = useState(post.commentCount || post.comment_count || 0);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [commentsLoaded, setCommentsLoaded] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [isSaving, setIsSaving] = useState(false);

    const toggleComments = async () => {
        const newShowState = !showComments;
        setShowComments(newShowState);
        if (newShowState && !commentsLoaded) {
            try {
                const route = `community/${communityId}/posts/${postId}/comments`;
                const data = await fetchData(route);
                setComments(data.comments || []);
                setCommentsLoaded(true);
            } catch (err) { console.error("Failed to load comments:", err); }
        }
    };

    const handlePostComment = async (e) => {
        if (e.key === 'Enter' && commentText.trim()) {
            try {
                const route = `community/${communityId}/posts/${postId}/comments`;
                const newCommentReal = await postData(route, { content: commentText });
                setComments([...comments, newCommentReal]);

                setCommentText("");
                setCommentCount(prev => prev + 1);
            } catch (err) {
                console.error(err);
                alert("Failed to post comment.");
            }
        }
    };

    const handleCommentDelete = (cId) => {
        setComments(prev => prev.filter(c => (c.commentId || c.comment_id) !== cId));
        setCommentCount(prev => prev - 1);
    };

    const handleCommentUpdate = (cId, newContent, newModified) => {
        setComments(prev => prev.map(c => {
            const currentId = c.commentId || c.comment_id;
            if (currentId === cId) {
                return { ...c, content: newContent, modified: newModified };
            }
            return c;
        }));
    };

    const handleLike = async () => {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        try {
            await postData(`community/${communityId}/posts/${postId}/likes`, {});
        } catch (error) {
            setIsLiked(!newLikedState);
            setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this post?")) return;
        try {
            await fetch(`http://localhost:5000/api/community/${communityId}/posts/${postId}`, {
                method: "DELETE",
                credentials: "include"
            });
            onDelete(postId);
        } catch (error) { console.error(error); }
    };

    const handleEditSave = async () => {
        if (!editContent.trim()) return alert("Content cannot be empty");
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:5000/api/community/${communityId}/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent }),
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to update");

            const updatedPost = await response.json();

            setContent(updatedPost.content);
            setModifiedAt(updatedPost.modified);

            setIsEditing(false);
            setIsMenuOpen(false);
        } catch (err) {
            console.error(err);
            alert("Failed to save edits.");
        } finally {
            setIsSaving(false);
        }
    };

    const canManagePost = currentUserId && postAuthorId && (String(currentUserId) === String(postAuthorId));
    const showCommunityLabel = communityName && (!view || view.type !== "community");

    const isPostEdited = modifiedAt && createdAt &&
        (new Date(modifiedAt).getTime() > new Date(createdAt).getTime() + 1000);

    return (
        <div className="post-card" style={{ marginBottom: "20px", background: "#fff", borderRadius: "8px", padding: "15px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", position: "relative" }}>
            <div className="post-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <a href={`/user/${postAuthorId}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                        <img
                            src={authorAvatar}
                            alt={authorName}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #eee" }}
                            onError={(e) => {e.target.src = "https://placehold.co/40?text=?"}}
                        />
                        <div>
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#050505" }}>{authorName}</h4>
                            <span style={{ fontSize: '12px', color: '#65676B' }}>
                                {displayCreated}

                                {isPostEdited && (
                                    <span style={{ marginLeft: "5px", fontStyle: "italic", color: "#888" }}>
                                        • Edited {displayEdited}
                                    </span>
                                )}
                            </span>
                        </div>
                    </a>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {showCommunityLabel && (
                        <a href={`/community/${communityId}`} style={{ fontSize: "12px", color: "#65676B", textDecoration: "none", fontWeight: "500" }}>
                            Posted in <span style={{ color: "#1877F2" }}>{communityName}</span>
                        </a>
                    )}
                    {canManagePost && (
                        <div style={{ position: "relative" }}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', padding: "0 5px", color: "#606770", fontWeight: "bold" }}>&#x22EF;</button>
                            {isMenuOpen && (
                                <div style={{ position: "absolute", right: 0, top: "25px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", borderRadius: "8px", overflow: "hidden", zIndex: 10, minWidth: "120px" }}>
                                    <button onClick={() => { setIsMenuOpen(false); setIsEditing(true); }} style={{ display: "block", width: "100%", padding: "10px 15px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#333" }} onMouseOver={(e) => e.target.style.background = "#f5f5f5"} onMouseOut={(e) => e.target.style.background = "none"}>✏️ Edit</button>
                                    <button onClick={() => { setIsMenuOpen(false); handleDelete(); }} style={{ display: "block", width: "100%", padding: "10px 15px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#dc3545" }} onMouseOver={(e) => e.target.style.background = "#f5f5f5"} onMouseOut={(e) => e.target.style.background = "none"}>🗑️ Delete</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="post-content" style={{ marginTop: "10px" }}>
                {isEditing ? (
                    <div style={{ marginBottom: "10px" }}>
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "4px", border: "1px solid #1877F2", fontFamily: "inherit", fontSize: "15px", resize: "none" }} />
                        <div style={{ marginTop: "5px", textAlign: "right", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button onClick={() => { setIsEditing(false); setEditContent(content); }} style={{ padding: "6px 12px", border: "none", background: "#eee", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleEditSave} disabled={isSaving} style={{ padding: "6px 12px", border: "none", background: "#1877F2", color: "white", borderRadius: "4px", cursor: "pointer", opacity: isSaving ? 0.7 : 1 }}>{isSaving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: "15px", lineHeight: "1.5", color: "#050505", whiteSpace: "pre-wrap" }}>{content}</p>
                        {postImage && <img src={postImage} alt="Post" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} /> }
                    </>
                )}
            </div>

            <div className="post-footer" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', gap: '20px' }}>
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? "#e0245e" : "#65676B", fontSize:'14px', display:'flex', alignItems:'center', gap:'5px' }}>
                    {isLiked ? "❤️" : "🤍"} {likeCount} Likes
                </button>
                <button onClick={toggleComments} style={{ background: 'none', border: 'none', cursor: 'pointer', color: "#65676B", fontSize:'14px', display:'flex', alignItems:'center', gap:'5px' }}>
                    💬 {commentCount} Comments
                </button>
            </div>

            {showComments && (
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #eee" }}>
                    <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {comments.length === 0 ? <p style={{ fontSize: "13px", color: "#888", textAlign: "center" }}>No comments yet.</p> : comments.map((c, idx) => (
                            <CommentItem key={c.commentId || c.comment_id || idx} comment={c} currentUser={currentUser} communityId={communityId} postId={postId} onDelete={handleCommentDelete} onUpdate={handleCommentUpdate} />
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <img src={currentUser?.avatarUrl || currentUser?.avatar_url || "https://placehold.co/30"} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit:"cover" }} />
                        <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={handlePostComment} style={{ flex: 1, padding: "8px 12px", borderRadius: "20px", border: "1px solid #ddd", background: "#f0f2f5", outline: "none" }} />
                    </div>
                </div>
            )}
        </div>
    );
}