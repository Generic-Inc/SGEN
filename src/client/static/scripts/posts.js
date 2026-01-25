function renderFeed(posts, container, showContext) {
    container.innerHTML = "";
    if (!posts || posts.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px;"><h3>No posts found.</h3></div>`;
        return;
    }
    posts.forEach(post => {
        container.insertAdjacentHTML('beforeend', createPostHTML(post, showContext));
    });
}

function createPostHTML(post, showContext) {
    const dateObj = new Date(post.created);
    const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const heartClass = post.isLiked ? 'fa-solid' : 'fa-regular';
    const colorClass = post.isLiked ? 'liked' : '';

    let contextHTML = "";
    if (showContext && post.communityName) {
        contextHTML = `
            <div style="font-size: 13px; color: #65676B; margin-bottom: 8px; padding-bottom:8px; border-bottom:1px solid #f0f2f5;">
                Posted in <a href="#" onclick="loadCommunityFeed(${post.communityId}); return false;" style="font-weight:600; color:#1c1e21; text-decoration:none;">${post.communityName}</a>
            </div>
        `;
    }

    return `
    <div class="post-card" id="post-${post.postId}">
        <div class="post-header" style="flex-direction: column; align-items: flex-start;">
            ${contextHTML}
            <div style="display: flex; align-items: center; gap: 12px; width:100%; margin-top:4px;">
                <img src="${post.author.avatarUrl || 'https://placehold.co/50'}" class="user-avatar">
                <div class="user-info"><h4>${post.author.displayName}</h4><span>${dateStr}</span></div>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" style="width:100%; display:block; margin-top:10px;">` : ''}
        <div class="post-actions">
            <button class="action-btn ${colorClass}" onclick="toggleLike(${post.communityId}, ${post.postId}, this)">
                <i class="${heartClass} fa-heart"></i> <span class="like-count">${post.likeCount}</span> Likes
            </button>
            <button class="action-btn" onclick="toggleComments(${post.communityId}, ${post.postId})">
                <i class="fa-regular fa-comment"></i> Comment
            </button>
            <button class="action-btn"><i class="fa-solid fa-share"></i> Share</button>
        </div>
        <div id="comments-${post.postId}" style="display:none; border-top:1px solid #f0f2f5; background:#fafafa; padding:15px;"></div>
    </div>`;
}

async function toggleLike(communityId, postId, btn) {
    const icon = btn.querySelector("i");
    const countSpan = btn.querySelector(".like-count");
    let count = parseInt(countSpan.innerText);
    if (btn.classList.contains("liked")) {
        btn.classList.remove("liked"); icon.classList.replace("fa-solid", "fa-regular"); countSpan.innerText = count - 1;
    } else {
        btn.classList.add("liked"); icon.classList.replace("fa-regular", "fa-solid"); countSpan.innerText = count + 1;
    }
    await authFetch(`/api/community/${communityId}/posts/${postId}/likes`, { method: "POST" });
}

async function toggleComments(communityId, postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section.style.display === "block") { section.style.display = "none"; return; }
    section.style.display = "block";
    section.innerHTML = `<div style="color:#888; text-align:center;">Loading comments...</div>`;

    try {
        const res = await authFetch(`/api/community/${communityId}/posts/${postId}/comments`);
        const data = await res.json();
        section.innerHTML = "";

        if (!data.comments || data.comments.length === 0) {
            section.innerHTML += `<div style="padding:10px; color:#999; text-align:center;">No comments yet.</div>`;
        } else {
            data.comments.forEach(c => {
                const isLiked = c.isLiked;
                const heartType = isLiked ? 'fa-solid' : 'fa-regular';
                const heartColor = isLiked ? '#FF4500' : '#65676B';
                const likeCount = c.likeCount || 0;

                section.innerHTML += `
                <div style="display:flex; gap:10px; margin-bottom:15px; align-items: flex-start;">
                    <img src="${c.author.avatarUrl || 'https://placehold.co/30'}" style="width:32px; height:32px; border-radius:50%;">
                    <div style="flex:1;">
                        <div style="background:#f0f2f5; padding:8px 12px; border-radius:15px; display:inline-block;">
                            <strong>${c.author.displayName}</strong>
                            <div style="margin-top:2px;">${c.content}</div>
                        </div>
                        <div style="font-size:12px; color:#65676B; margin-left:12px; margin-top:2px;">
                            ${new Date(c.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    <div style="text-align:center; cursor:pointer; min-width:30px;" 
                         onclick="toggleCommentLike(${communityId}, ${postId}, ${c.commentId}, this)">
                        <i class="${heartType} fa-heart" style="color: ${heartColor};"></i>
                        <div class="comment-like-count" style="font-size:11px;">${likeCount > 0 ? likeCount : ''}</div>
                    </div>
                </div>`;
            });
        }
        section.innerHTML += `
            <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
                 <div style="width:32px; height:32px; border-radius:50%; background:#ddd;"></div>
                 <div style="flex:1; background:#f0f2f5; border-radius:20px; padding:8px 15px; display:flex; align-items:center;">
                    <input type="text" placeholder="Write a comment..." style="flex:1; border:none; background:transparent; outline:none;">
                    <i class="fa-regular fa-paper-plane" style="color:#65676B; cursor:pointer;"></i>
                 </div>
            </div>`;
    } catch(e) { section.innerHTML = "Error loading comments."; }
}

async function toggleCommentLike(communityId, postId, commentId, btnElement) {
    const icon = btnElement.querySelector("i");
    const countDiv = btnElement.querySelector(".comment-like-count");
    let count = parseInt(countDiv.innerText) || 0;

    if (icon.classList.contains("fa-solid")) {
        icon.classList.remove("fa-solid"); icon.classList.add("fa-regular"); icon.style.color = "#65676B"; count--;
    } else {
        icon.classList.remove("fa-regular"); icon.classList.add("fa-solid"); icon.style.color = "#FF4500"; count++;
    }
    countDiv.innerText = count > 0 ? count : "";

    try {
        await authFetch(`/api/community/${communityId}/posts/${postId}/comments/${commentId}/likes`, { method: "POST" });
    } catch(err) { console.error("Comment like failed", err); }
}