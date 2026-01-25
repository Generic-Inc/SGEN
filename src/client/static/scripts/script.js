document.addEventListener("DOMContentLoaded", () => {
    console.log("SGEN Client Loaded! 🚀");

    loadHomeFeed();
});

async function loadHomeFeed() {
    const feedContainer = document.getElementById("feed-content");

    feedContainer.innerHTML = `
        <div style="text-align:center; padding:40px; color:#888;">
            <i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Your Feed...
        </div>`;

    document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");

    try {
        const response = await fetch(`/api/feed`);
        const data = await response.json();

        renderFeed(data.posts, feedContainer);

    } catch (error) {
        console.error("Home Feed Error:", error);
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Failed to load feed.</div>`;
    }
}

async function loadCommunityFeed(communityId, element) {
    const feedContainer = document.getElementById("feed-content");

    if(element) {
        document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");
        element.style.backgroundColor = "#e8f0fe";
    }

    feedContainer.innerHTML = `
        <div style="text-align:center; padding:40px; color:#888;">
            <i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Community...
        </div>`;

    try {
        const response = await fetch(`/api/community/${communityId}/posts`);
        const data = await response.json();

        renderFeed(data.posts, feedContainer);

    } catch (error) {
        console.error("Community Feed Error:", error);
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Error loading community.</div>`;
    }
}

function renderFeed(posts, container) {
    container.innerHTML = "";

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
            
            <button class="action-btn">
                <i class="fa-regular fa-comment"></i> Comment
            </button>
            
            <button class="action-btn"><i class="fa-solid fa-share"></i> Share</button>
        </div>
    </div>
    `;
}

async function toggleLike(communityId, postId, btn) {
    const icon = btn.querySelector("i");
    const countSpan = btn.querySelector(".like-count");
    let count = parseInt(countSpan.innerText);

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