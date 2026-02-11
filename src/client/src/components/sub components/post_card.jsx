import { useState, useEffect } from "react";
import { postData, fetchData } from "../../static/api";
import "../../static/styles/community.css";

export default function PostCard({ post, currentUser, onDelete }) {
    // --- MAPPING ---
    const authorObj = post.author || {};
    const authorName = authorObj.name || authorObj.displayName || post.author_name || "Unknown";
    const authorAvatar = authorObj.avatar_url || authorObj.avatarUrl || post.author_avatar || "https://placehold.co/40";

    const postContent = post.content || post.description || "";
    const postImage = post.image_url || post.imageUrl || null;
    const postDate = new Date(post.created_at || post.created || Date.now()).toLocaleDateString();

    const communityId = post.communityId || post.community_id;
    const postId = post.postId || post.post_id;

    // --- STATE ---
    const [likeCount, setLikeCount] = useState(post.likeCount || post.like_count || 0);
    const [isLiked, setIsLiked] = useState(post.isLiked || post.is_liked || false);

    // 1. Initialize Comment Count from Prop
    // The backend now sends "commentCount" (camelCase due to public_json) or "comment_count"
    const [commentCount, setCommentCount] = useState(post.commentCount || post.comment_count || 0);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [commentsLoaded, setCommentsLoaded] = useState(false);

    // --- HANDLERS ---
    const toggleComments = async () => {
        const newShowState = !showComments;
        setShowComments(newShowState);

        if (newShowState && !commentsLoaded) {
            try {
                const route = `community/${communityId}/posts/${postId}/comments`;
                const data = await fetchData(route);
                const loadedComments = data.comments || [];

                setComments(loadedComments);
                setCommentsLoaded(true);
                // 2. Sync count just in case backend was slightly stale
                setCommentCount(loadedComments.length);
            } catch (err) {
                console.error("Failed to load comments:", err);
            }
        }
    };

    const handlePostComment = async (e) => {
        if (e.key === 'Enter' && commentText.trim()) {
            try {
                const route = `community/${communityId}/posts/${postId}/comments`;

                const tempComment = {
                    commentId: Date.now(),
                    content: commentText,
                    author: currentUser,
                    created: new Date().toISOString()
                };

                setComments([...comments, tempComment]);
                setCommentText("");
                // 3. Increment Count Immediately
                setCommentCount(prev => prev + 1);

                await postData(route, { content: tempComment.content });
            } catch (err) {
                console.error("Failed to post comment:", err);
                // Revert on failure
                setCommentCount(prev => prev - 1);
                alert("Failed to post comment.");
            }
        }
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

    const isOwner = currentUser && (currentUser.user_id === (authorObj.user_id || post.author_id));

    return (
        <div className="post-card" style={{ marginBottom: "20px", background: "#fff", borderRadius: "8px", padding: "15px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
            {/* HEADER */}
            <div className="post-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src={authorAvatar}
                        alt={authorName}
                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #eee" }}
                        onError={(e) => {e.target.src = "https://placehold.co/40?text=?"}}
                    />
                    <div>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#050505" }}>{authorName}</h4>
                        <span style={{ fontSize: '12px', color: '#65676B' }}>{postDate}</span>
                    </div>
                </div>
                {isOwner && <button onClick={handleDelete} style={{border:'none', background:'none', cursor:'pointer', color:'red'}}>🗑️</button>}
            </div>

            {/* CONTENT */}
            <div className="post-content" style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "15px", lineHeight: "1.5", color: "#050505" }}>{postContent}</p>
                {postImage && <img src={postImage} alt="Post" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} /> }
            </div>

            {/* FOOTER */}
            <div className="post-footer" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', gap: '20px' }}>
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? "#e0245e" : "#65676B", fontSize:'14px', display:'flex', alignItems:'center', gap:'5px' }}>
                    {isLiked ? "❤️" : "🤍"} {likeCount} Likes
                </button>

                <button
                    onClick={toggleComments}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: "#65676B", fontSize:'14px', display:'flex', alignItems:'center', gap:'5px' }}
                >
                    {/* 4. Display the Count */}
                    💬 {commentCount} Comments
                </button>
            </div>

            {/* COMMENT SECTION */}
            {showComments && (
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #eee" }}>

                    {/* Comment List */}
                    <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {comments.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "#888", textAlign: "center" }}>No comments yet. Be the first!</p>
                        ) : (
                            comments.map((c, idx) => {
                                const cAuthor = c.author || {};
                                const cName = cAuthor.displayName || cAuthor.display_name || cAuthor.username || "User";
                                const cAvatar = cAuthor.avatarUrl || cAuthor.avatar_url || "https://placehold.co/30";

                                return (
                                    <div key={c.commentId || c.comment_id || idx} style={{ display: "flex", gap: "8px" }}>
                                        <img src={cAvatar} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit:"cover" }} />
                                        <div style={{ background: "#f0f2f5", padding: "8px 12px", borderRadius: "15px", fontSize: "14px" }}>
                                            <div style={{ fontWeight: "600", fontSize: "13px" }}>{cName}</div>
                                            <div>{c.content}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <img
                            src={currentUser?.avatar_url || "https://placehold.co/30"}
                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit:"cover" }}
                        />
                        <input
                            type="text"
                            placeholder="Write a comment... (Press Enter)"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={handlePostComment}
                            style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: "20px",
                                border: "1px solid #ddd",
                                background: "#f0f2f5",
                                outline: "none"
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}