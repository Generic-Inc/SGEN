document.addEventListener("DOMContentLoaded", () => {
    console.log("SGEN Client Loaded!");
    loadPosts();
});

async function loadPosts() {
    const feedContainer = document.getElementById("feed-content");

    feedContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Loading posts...</div>';

    try {
        const response = await fetch("/api/community/1/posts");

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const posts = await response.json();
        console.log("Posts received:", posts);

        feedContainer.innerHTML = "";

        if (posts.length === 0) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:20px;">No posts yet. Be the first!</div>';
            return;
        }

        posts.forEach(post => {
            const postHTML = createPostHTML(post);
            feedContainer.insertAdjacentHTML('beforeend', postHTML);
        });

    } catch (error) {
        console.error("Error loading posts:", error);
        feedContainer.innerHTML = `<div style="text-align:center; color:red; padding:20px;">Error loading feed.<br><small>${error.message}</small></div>`;
    }
}

function createPostHTML(post) {
    const dateObj = new Date(post.created);
    const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const avatarUrl = post.author.avatarUrl || "https://placehold.co/40";
    const postImage = post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" style="width:100%; display:block; margin-top:10px;">` : "";

    return `
    <div class="post-card" id="post-${post.postId}">
        <div class="post-header">
            <img src="${avatarUrl}" class="user-avatar" alt="${post.author.username}">
            <div class="user-info">
                <h4>${post.author.displayName}</h4>
                <span>${dateStr}</span>
            </div>
        </div>
        
        <div class="post-content">
            ${post.content}
        </div>
        
        ${postImage}
        
        <div class="post-actions">
            <button class="action-btn" onclick="toggleLike(${post.communityId}, ${post.postId})">
                <i class="fa-regular fa-heart"></i> ${post.likeCount} Likes
            </button>
            <button class="action-btn"><i class="fa-regular fa-comment"></i> Comment</button>
            <button class="action-btn"><i class="fa-solid fa-share"></i> Share</button>
        </div>
    </div>
    `;
}

async function toggleLike(communityId, postId) {
    try {
        await fetch(`/api/communities/${communityId}/posts/${postId}/likes`, { method: "POST" });
        loadPosts();
    } catch (error) {
        console.error("Like error:", error);
    }
}