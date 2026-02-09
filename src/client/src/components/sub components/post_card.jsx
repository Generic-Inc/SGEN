import { useState } from "react";
import Profile from "./profile";
import { postData } from "../../static/api";
import "../../static/styles/community.css";

export default function PostCard({ post, currentUser, onDelete }) {
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(post.content);

    const handleLike = async () => {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

        try {
            await postData(`community/${post.communityId}/posts/${post.postId}/likes`, {});
        } catch (error) {
            console.error("Like failed", error);
            setIsLiked(!newLikedState);
            setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const response = await fetch(`http://localhost:5000/api/community/${post.communityId}/posts/${post.postId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (response.ok) {
                onDelete(post.postId);
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await fetch(`http://localhost:5000/api/community/${post.communityId}/posts/${post.postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content }),
                credentials: "include"
            });
            setIsEditing(false);
            setIsMenuOpen(false);
        } catch (error) {
            console.error("Edit failed", error);
        }
    };

    const isOwner = currentUser && post.author && currentUser.user_id === post.author.userId;

    return (
        <div className="post-card">
            {/* HEADER */}
            <div className="post-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Reusing Profile Component */}
                    <Profile src={post.author?.avatarUrl} />
                    <div className="post-info">
                        <h4>{post.author?.displayName}</h4>
                        <span style={{ fontSize: '12px', color: '#65676B' }}>
                            {new Date(post.created).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Edit Menu (Only for Owner) */}
                {isOwner && (
                    <div className="post-options" style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px'}}
                        >
                            ...
                        </button>

                        {isMenuOpen && (
                            <div className="menu-dropdown" style={{
                                position: 'absolute', right: 0, top: '100%',
                                background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                padding: '10px', borderRadius: '8px', zIndex: 10, minWidth: '100px'
                            }}>
                                <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', padding: '5px' }}>Edit</div>
                                <div onClick={handleDelete} style={{ cursor: 'pointer', padding: '5px', color: 'red' }}>Delete</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="post-content" style={{ marginTop: '10px' }}>
                {isEditing ? (
                    <div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', minHeight: '80px', marginBottom: '10px' }}
                        />
                        <button onClick={handleSaveEdit}>Save</button> &nbsp;
                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                ) : (
                    <p>{content}</p>
                )}

                {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post" style={{ width: '100%', marginTop: '10px', borderRadius: '8px' }} />
                )}
            </div>

            {/* FOOTER */}
            <div className="post-footer" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                    {isLiked ? "❤️" : "🤍"} {likeCount} Likes
                </button>
            </div>
        </div>
    );
}