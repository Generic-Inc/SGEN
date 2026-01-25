document.addEventListener("DOMContentLoaded", () => {
    console.log("SGEN Client Loaded! 🚀");

    // 1. Load the Home Feed by default
    loadHomeFeed();
});

// ==========================================
// 1. HOME FEED (Aggregated)
// ==========================================
async function loadHomeFeed() {
    const feedContainer = document.getElementById("feed-content");

    // UI: Show "Home" card, Hide "Community Info" card
    const homeCard = document.getElementById("home-card");
    const infoCard = document.getElementById("info-card");
    if(homeCard) homeCard.style.display = "block";
    if(infoCard) infoCard.style.display = "none";

    // UI: Reset Sidebar Highlights
    document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");

    // UI: Loading State
    feedContainer.innerHTML = `
        <div style="text-align:center; padding:40px; color:#888;">
            <i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Your Feed...
        </div>`;

    try {
        const response = await fetch(`/api/feed`);
        const data = await response.json();
        renderFeed(data.posts, feedContainer);
    } catch (error) {
        console.error("Home Feed Error:", error);
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Failed to load feed.</div>`;
    }
}

// ==========================================
// 2. COMMUNITY FEED (Specific)
// ==========================================
async function loadCommunityFeed(communityId, element) {
    const feedContainer = document.getElementById("feed-content");

    // UI: Highlight Sidebar
    if(element) {
        document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");
        element.style.backgroundColor = "#e8f0fe";
    }

    // UI: Show "Community Info" card, Hide "Home" card
    const homeCard = document.getElementById("home-card");
    const infoCard = document.getElementById("info-card");
    if(homeCard) homeCard.style.display = "none";
    if(infoCard) infoCard.style.display = "block";

    // UI: Loading State
    feedContainer.innerHTML = `
        <div style="text-align:center; padding:40px; color:#888;">
            <i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Community...
        </div>`;

    // --- STEP A: Fetch Community Details (Right Sidebar) ---
    try {
        const res = await fetch(`/api/community/${communityId}`);
        if(res.ok) {
            const data = await res.json();
            // Update the HTML elements in the right sidebar
            const titleEl = document.getElementById("info-title");
            const descEl = document.getElementById("info-desc");
            const memEl = document.getElementById("info-members");

            if(titleEl) titleEl.innerText = data.displayName;
            if(descEl) descEl.innerText = data.description || "No description available.";
            if(memEl) memEl.innerText = `${data.memberCount} Members`;
        }
    } catch (err) {
        console.error("Failed to load community details", err);
    }

    // --- STEP B: Fetch Posts ---
    try {
        const response = await fetch(`/api/community/${communityId}/posts`);
        const data = await response.json();
        renderFeed(data.posts, feedContainer);
    } catch (error) {
        console.error("Community Feed Error:", error);
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Error loading community.</div>`;
    }
}

// ==========================================
// 3. RENDER LOGIC (Shared)
// ==========================================
function renderFeed(posts, container) {
    container.innerHTML = ""; // Clear loader

    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <h3>No posts found.</h3>
                <p>Try joining a community or checking back later!</p>
            </div>`;
        return;
    }

    posts.forEach(post => {
        container.insertAdjacentHTML('beforeend', createPostHTML(post));
    });
}

function createPostHTML(post) {
    const dateObj = new Date(post.created);
    const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Logic: Red Heart if isLiked is true
    const heartClass = post.isLiked ? 'fa-solid' : 'fa-regular';
    const colorClass = post.isLiked ? 'liked' : '';

    return `
    <div class="post-card" id="post-${post.postId}">
        <div class="post-header">
            <img src="${post.author.avatarUrl || 'https://placehold.co/50'}" class="user-avatar">
            <div class="user-info">
                <h4>${post.author.displayName}</h4>
                <span>${dateStr}</span>
            </div>
        </div>
        
        <div class="post-content">${post.content}</div>
        
        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" style="width:100%; display:block; margin-top:10px;">` : ''}
        
        <div class="post-actions">
            <button class="action-btn ${colorClass}" onclick="toggleLike(${post.communityId}, ${post.postId}, this)">
                <i class="${heartClass} fa-heart"></i> 
                <span class="like-count">${post.likeCount}</span> Likes
            </button>
            
            <button class="action-btn" onclick="toggleComments(${post.communityId}, ${post.postId})">
                <i class="fa-regular fa-comment"></i> Comment
            </button>
            
            <button class="action-btn"><i class="fa-solid fa-share"></i> Share</button>
        </div>
        
        <div id="comments-${post.postId}" style="display:none; border-top:1px solid #f0f2f5; background:#fafafa; padding:15px;">
            </div>
    </div>
    `;
}

// ==========================================
// 4. INTERACTION LOGIC
// ==========================================
async function toggleLike(communityId, postId, btn) {
    const icon = btn.querySelector("i");
    const countSpan = btn.querySelector(".like-count");
    let count = parseInt(countSpan.innerText);

    // Optimistic UI Update
    if (btn.classList.contains("liked")) {
        btn.classList.remove("liked");
        icon.classList.replace("fa-solid", "fa-regular");
        countSpan.innerText = count - 1;
    } else {
        btn.classList.add("liked");
        icon.classList.replace("fa-regular", "fa-solid");
        countSpan.innerText = count + 1;
    }

    try {
        await fetch(`/api/community/${communityId}/posts/${postId}/likes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: 1 })
        });
    } catch(err) {
        console.error("Like failed", err);
    }
}

async function toggleComments(communityId, postId) {
    const section = document.getElementById(`comments-${postId}`);

    // Toggle Visibility
    if (section.style.display === "block") {
        section.style.display = "none";
        return;
    }
    section.style.display = "block";
    section.innerHTML = `<div style="color:#888; text-align:center;">Loading comments...</div>`;

    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}/comments`);
        const data = await res.json();

        section.innerHTML = ""; // Clear loader

        // 1. List Comments
        if (data.comments.length === 0) {
            section.innerHTML += `<div style="padding:10px; color:#999; text-align:center;">No comments yet.</div>`;
        } else {
            data.comments.forEach(c => {
                section.innerHTML += `
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <img src="${c.author.avatarUrl || 'https://placehold.co/30'}" style="width:32px; height:32px; border-radius:50%;">
                    <div>
                        <div style="background:#f0f2f5; padding:8px 12px; border-radius:15px;">
                            <strong>${c.author.displayName}</strong>
                            <div style="margin-top:2px;">${c.content}</div>
                        </div>
                        <div style="font-size:12px; color:#65676B; margin-left:12px; margin-top:2px;">
                            Like · Reply · ${new Date(c.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>`;
            });
        }

        // 2. Add Input Box (Visual Match)
        section.innerHTML += `
            <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
                 <div style="width:32px; height:32px; border-radius:50%; background:#ddd;"></div>
                 <div style="flex:1; background:#f0f2f5; border-radius:20px; padding:8px 15px; display:flex; align-items:center;">
                    <input type="text" placeholder="Write a comment..." style="flex:1; border:none; background:transparent; outline:none;">
                    <i class="fa-regular fa-paper-plane" style="color:#65676B; cursor:pointer;"></i>
                 </div>
            </div>
        `;

    } catch(e) {
        section.innerHTML = "Error loading comments.";
        console.error(e);
    }
}