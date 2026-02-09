import { useState, useEffect } from "react"; // Added useEffect
import Profile from "./profile";
import { postData } from "../../static/api";
import "../../static/styles/community.css";

export default function PostCard({ post, currentUser, onDelete }) {
    // --- DEBUGGER: Print the first post if it looks broken ---
    useEffect(() => {
        if (!post.author && !post.author_id) {
            console.log("⚠️ BROKEN POST FOUND:", post);
        }
    }, [post]);

    // --- 🛡️ ROBUST DATA HANDLING ---
    // 1. Get the Author Object (handle snake_case or nested object)
    let authorObj = post.author || {};

    // 2. Extract Name (Check for empty strings too!)
    let rawName = authorObj.name || authorObj.displayName || post.author_name;
    let displayName = (rawName && rawName.trim() !== "") ? rawName : "Unknown User";

    // 3. Extract Avatar
    let rawAvatar = authorObj.avatar_url || authorObj.avatarUrl || post.author_avatar;
    let displayAvatar = rawAvatar || "https://placehold.co/40?text=?";

    // 4. Extract Content & Date
    const postContent = post.content || post.description || "";
    const postImage = post.image_url || post.imageUrl || null;
    const postDate = new Date(post.created_at || post.created || Date.now()).toLocaleDateString();

    // --- STATE & HANDLERS ---
    const [likeCount, setLikeCount] = useState(post.like_count || post.likeCount || 0);
    const [isLiked, setIsLiked] = useState(post.is_liked || post.isLiked || false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(postContent);

    const handleLike = async () => {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        try {
            const cId = post.community_id || post.communityId;
            const pId = post.post_id || post.postId;
            await postData(`community/${cId}/posts/${pId}/likes`, {});
        } catch (error) {
            setIsLiked(!newLikedState);
            setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this post?")) return;
        try {
            const cId = post.community_id || post.communityId;
            const pId = post.post_id || post.postId;
            await fetch(`http://localhost:5000/api/community/${cId}/posts/${pId}`, {
                method: "DELETE",
                credentials: "include"
            });
            onDelete(pId);
        } catch (error) { console.error(error); }
    };

    const isOwner = currentUser && (currentUser.user_id === (authorObj.user_id || post.author_id));

    return (
        <div className="post-card" style={{ marginBottom: "20px", background: "#fff", borderRadius: "8px", padding: "15px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
            {/* HEADER */}
            <div className="post-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src={displayAvatar}
                        alt={displayName}
                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #eee" }}
                        onError={(e) => {e.target.src = "https://placehold.co/40?text=?"}} // Fallback if image fails
                    />
                    <div>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#050505" }}>{displayName}</h4>
                        <span style={{ fontSize: '12px', color: '#65676B' }}>{postDate}</span>
                    </div>
                </div>
                {isOwner && <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'20px'}}>...</button>}
            </div>

            {/* CONTENT */}
            <div className="post-content" style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "15px", lineHeight: "1.5", color: "#050505" }}>{content}</p>
                {postImage && <img src={postImage} alt="Post" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} /> }
            </div>

            {/* FOOTER */}
            <div className="post-footer" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? "#e0245e" : "#65676B", fontSize:'14px', display:'flex', alignItems:'center', gap:'5px' }}>
                    {isLiked ? "❤️" : "🤍"} {likeCount} Likes
                </button>
            </div>
        </div>
    );
}