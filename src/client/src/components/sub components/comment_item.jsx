import { useState } from "react";
import { postData } from "../../static/api";

export default function CommentItem({ comment, currentUser, communityId, postId, onDelete, onUpdate }) {
    const cAuthor = comment.author || {};
    const cName = cAuthor.displayName || cAuthor.display_name || cAuthor.username || "User";
    const cAvatar = cAuthor.avatarUrl || cAuthor.avatar_url || "https://placehold.co/30";
    const cId = comment.commentId || comment.comment_id;

    // Permissions
    const currentUserId = currentUser?.userId || currentUser?.user_id;
    const commentAuthorId = cAuthor.userId || cAuthor.user_id;
    const canManageComment = currentUserId && commentAuthorId && (currentUserId == commentAuthorId);

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Like State
    const [cLikeCount, setCLikeCount] = useState(comment.likeCount || comment.like_count || 0);
    const [cIsLiked, setCIsLiked] = useState(comment.isLiked || comment.is_liked || false);

    // Edited Check
    const isEdited = comment.modified && comment.created && (comment.modified !== comment.created);

    // Handlers
    const handleSave = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:5000/api/community/${communityId}/posts/${postId}/comments/${cId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent }),
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed");

            const updatedComment = await response.json();
            onUpdate(cId, updatedComment.content, updatedComment.modified);
            setIsEditing(false);
        } catch (e) {
            alert("Failed to update comment");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete comment?")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/community/${communityId}/posts/${postId}/comments/${cId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (response.ok) {
                onDelete(cId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCommentLike = async () => {
        const newLikedState = !cIsLiked;
        setCIsLiked(newLikedState);
        setCLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        try {
            await postData(`community/${communityId}/posts/${postId}/comments/${cId}/likes`, {});
        } catch (error) {
            // Revert on error
            setCIsLiked(!newLikedState);
            setCLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    return (
        <div style={{ display: "flex", gap: "8px" }}>
            {/* LINK TO PROFILE */}
            <a href={`/user/${commentAuthorId}`} style={{ textDecoration: "none" }}>
                <img src={cAvatar} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit:"cover", marginTop: "4px" }} />
            </a>

            <div style={{ flex: 1 }}>
                {/* BUBBLE CONTAINER */}
                <div
                    style={{
                        background: "#f0f2f5",
                        padding: "8px 12px",
                        paddingRight: (canManageComment && !isEditing) ? "30px" : "12px",
                        borderRadius: "15px",
                        fontSize: "14px",
                        display: "inline-block",
                        minWidth: "150px",
                        position: "relative",
                        wordBreak: "break-word"
                    }}
                    onMouseLeave={() => setIsMenuOpen(false)}
                >

                    {/* Header */}
                    <div style={{ fontWeight: "600", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <a href={`/user/${commentAuthorId}`} style={{ textDecoration: "none", color: "inherit" }}>
                            {cName}
                        </a>
                        {isEdited && <span style={{marginLeft: "5px", fontWeight: "normal", fontStyle: "italic", fontSize: "11px", color: "#666"}}>• Edited</span>}
                    </div>

                    {/* Content: View vs Edit Mode */}
                    {isEditing ? (
                        <div style={{ marginTop: "5px" }}>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                style={{
                                    width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #1877F2",
                                    marginBottom: "5px", minHeight: "60px", fontFamily: "inherit", fontSize: "14px", resize: "none"
                                }}
                            />
                            <div style={{ fontSize: "11px", display: "flex", gap: "8px" }}>
                                <span onClick={handleSave} style={{ color: "#1877F2", cursor: "pointer", fontWeight: "bold" }}>{isSaving ? "..." : "Save"}</span>
                                <span onClick={() => { setIsEditing(false); setEditContent(comment.content); }} style={{ cursor: "pointer" }}>Cancel</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: "2px" }}>{comment.content}</div>
                    )}

                    {/* INTERNAL MENU */}
                    {canManageComment && !isEditing && (
                        <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                style={{
                                    border: "none", background: "none", cursor: "pointer",
                                    color: "#606770", fontWeight: "bold", fontSize: "16px",
                                    padding: "0", lineHeight: "1"
                                }}
                            >
                                &#x22EF;
                            </button>

                            {isMenuOpen && (
                                <div style={{
                                    position: "absolute", top: "20px", right: "0",
                                    background: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                    borderRadius: "6px", overflow: "hidden", zIndex: 10, minWidth: "80px"
                                }}>
                                    <div onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} style={{ padding: "8px 12px", cursor: "pointer", fontSize: "12px", ":hover": {background: "#eee"} }}>✏️ Edit</div>
                                    <div onClick={handleDelete} style={{ padding: "8px 12px", cursor: "pointer", fontSize: "12px", color: "red" }}>🗑️ Delete</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* LIKE BUTTON ROW */}
                <div style={{ display: "flex", gap: "10px", paddingLeft: "12px", marginTop: "2px", fontSize: "12px", color: "#65676B" }}>
                    <span
                        onClick={handleCommentLike}
                        style={{ cursor: "pointer", fontWeight: cIsLiked ? "bold" : "normal", color: cIsLiked ? "#e0245e" : "inherit" }}
                    >
                        Like
                    </span>
                    {cLikeCount > 0 && <span>{cLikeCount}</span>}
                </div>
            </div>
        </div>
    );
}