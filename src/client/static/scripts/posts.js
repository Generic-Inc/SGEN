async function openCreateModal() {
    const modal = document.getElementById("create-modal");
    const selectWrapper = document.getElementById("community-select-wrapper");
    const selectBox = document.getElementById("modal-community-select");
    const hiddenId = document.getElementById("modal-community-id-hidden");
    const guideName = document.getElementById("guide-comm-name");

    document.getElementById("post-title").value = "";
    document.getElementById("post-desc").value = "";

    modal.style.display = "flex";

    if (window.currentCommunityId) {
        selectWrapper.style.display = "none";
        hiddenId.value = window.currentCommunityId;
        const titleEl = document.getElementById("info-title");
        guideName.innerText = titleEl ? titleEl.innerText : "Community";
    } else {
        selectWrapper.style.display = "block";
        hiddenId.value = "";
        guideName.innerText = "General";

        selectBox.innerHTML = `<option value="">Select a community...</option>`;
        try {
            const res = await authFetch('/api/my-communities');
            const data = await res.json();
            data.communities.forEach(comm => {
                const opt = document.createElement("option");
                opt.value = comm.communityId;
                opt.innerText = comm.displayName;
                selectBox.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    }
}

function closeCreateModal() {
    const modal = document.getElementById("create-modal");
    modal.style.display = "none";
    const btn = modal.querySelector("button");
    btn.innerText = "Post";
    btn.setAttribute("onclick", "submitNewPost()");
}

async function submitNewPost() {
    const hiddenId = document.getElementById("modal-community-id-hidden").value;
    const selectId = document.getElementById("modal-community-select").value;
    const targetId = hiddenId || selectId;

    if (!targetId) return alert("Please select a community.");

    const title = document.getElementById("post-title").value.trim();
    const desc = document.getElementById("post-desc").value.trim();

    if (!desc) return alert("Please write a description.");

    let finalContent = desc;
    if (title) finalContent = `**${title}**\n\n${desc}`;

    try {
        const res = await authFetch(`/api/community/${targetId}/posts`, {
            method: "POST",
            body: JSON.stringify({ content: finalContent, imageUrl: null })
        });

        if (res.ok) {
            closeCreateModal();
            if (window.refreshFeed) {
                window.refreshFeed(window.currentCommunityId);
            }
        } else {
            const err = await res.json();
            alert(err.error || "Failed to post.");
        }
    } catch (e) {
        console.error(e);
        alert("Connection error");
    }
}

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

    // Check if modified is significantly after created (buffer for DB slight delays)
    const modObj = new Date(post.modified);
    const isEdited = (modObj - dateObj) > 2000;

    let contextHTML = "";
    if (showContext && post.communityName) {
        contextHTML = `
            <div style="font-size: 13px; color: #65676B; margin-bottom: 8px; padding-bottom:8px; border-bottom:1px solid #f0f2f5;">
                Posted in <a href="#" onclick="openCommunity(${post.communityId}); return false;" style="font-weight:600; color:#1c1e21; text-decoration:none;">${post.communityName}</a>
            </div>
        `;
    }

    let contentDisplay = post.content;
    contentDisplay = contentDisplay.replace(/\n/g, '<br>');
    contentDisplay = contentDisplay.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `
    <div class="post-card" id="post-${post.postId}" style="transition: opacity 0.3s;">
        <div class="post-header" style="flex-direction: column; align-items: flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%; align-items: flex-start;">
                ${contextHTML}
                
                <div style="display: flex; gap: 12px; color: #ccc;">
                    <div style="cursor:pointer;" title="Edit Post" 
                         onclick="openEditPostModal(${post.postId}, ${post.communityId}, \`${post.content.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </div>
                    
                    <div style="cursor:pointer;" title="Delete Post" 
                         onclick="deletePost(${post.communityId}, ${post.postId})">
                        <i class="fa-solid fa-trash"></i>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px; width:100%; margin-top:4px;">
                <img src="${post.author.avatarUrl || 'https://placehold.co/50'}" class="user-avatar" 
                     style="cursor: pointer;" onclick="loadUserProfile(${post.author.userId})">
                <div class="user-info">
                    <h4 style="cursor: pointer;" onclick="loadUserProfile(${post.author.userId})">
                        ${post.author.displayName}
                    </h4>
                    <span>${dateStr} ${isEdited ? '<span style="font-size:11px; opacity:0.6; font-style:italic;">(edited)</span>' : ''}</span>
                </div>
            </div>
        </div>
        <div class="post-content">${contentDisplay}</div>
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

async function toggleComments(communityId, postId, forceRefresh = false) {
    const section = document.getElementById(`comments-${postId}`);

    if (!forceRefresh && section.style.display === "block") {
        section.style.display = "none";
        return;
    }

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
                    <img src="${c.author.avatarUrl || 'https://placehold.co/30'}" style="width:32px; height:32px; border-radius:50%; cursor:pointer;"
                         onclick="loadUserProfile(${c.author.userId})">
                    <div style="flex:1;">
                    <div style="background:#f0f2f5; padding:8px 12px; border-radius:15px; display:inline-block; position:relative;">
                            <strong style="cursor:pointer;" onclick="loadUserProfile(${c.author.userId})">${c.author.displayName}</strong>
                            <div style="margin-top:2px;">${c.content}</div>
                                <div style="position:absolute; top:5px; right:-25px; cursor:pointer; color:#ccc; font-size:12px;" 
                                    onclick="deleteComment(${communityId}, ${postId}, ${c.commentId})">
                                    <i class="fa-solid fa-trash"></i>
                                </div>
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
                    
                    <input type="text" 
                           placeholder="Write a comment..." 
                           onkeydown="handleCommentKey(event, ${communityId}, ${postId}, this)"
                           style="flex:1; border:none; background:transparent; outline:none;">
                    
                    <i class="fa-regular fa-paper-plane" 
                       onclick="submitComment(${communityId}, ${postId}, this.previousElementSibling)"
                       style="color:#65676B; cursor:pointer;"></i>
                 </div>
            </div>`;

    } catch(e) { section.innerHTML = "Error loading comments."; }
}

async function submitComment(communityId, postId, inputElement) {
    const content = inputElement.value.trim();
    if (!content) return;
    if (!communityId) {
        alert("Error: Community ID missing.");
        return;
    }

    try {
        const res = await authFetch(`/api/community/${communityId}/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ content: content })
        });

        if (res.ok) {
            inputElement.value = "";
            toggleComments(communityId, postId, true);
        }
    } catch (e) { console.error(e); }
}

function handleCommentKey(event, communityId, postId, inputElement) {
    if (event.key === "Enter") {
        submitComment(communityId, postId, inputElement);
    }
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

async function deletePost(communityId, postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
        const res = await authFetch(`/api/community/${communityId}/posts/${postId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            const el = document.getElementById(`post-${postId}`);
            if (el) {
                el.style.opacity = "0";
                setTimeout(() => el.remove(), 300);
            }
        } else {
            alert("Failed to delete post.");
        }
    } catch (e) {
        console.error(e);
        alert("Connection error.");
    }
}

async function deleteComment(communityId, postId, commentId) {
    if (!confirm("Delete this comment?")) return;

    try {
        const res = await authFetch(`/api/community/${communityId}/posts/${postId}/comments/${commentId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            toggleComments(communityId, postId, true);
        }
    } catch (e) { console.error(e); }
}

function openEditPostModal(postId, communityId, rawContent) {
    const modal = document.getElementById("create-modal");
    const titleInput = document.getElementById("post-title");
    const descInput = document.getElementById("post-desc");
    const submitBtn = modal.querySelector("button[onclick='submitNewPost()']");

    let title = "";
    let desc = rawContent;
    if (rawContent.startsWith("**")) {
        const parts = rawContent.split("\n\n");
        title = parts[0].replace(/\*\*/g, "");
        desc = parts.slice(1).join("\n\n");
    }

    titleInput.value = title;
    descInput.value = desc;

    submitBtn.innerText = "Save Changes";
    submitBtn.setAttribute("onclick", `savePostEdit(${postId}, ${communityId})`);

    modal.style.display = "flex";
}

async function savePostEdit(postId, communityId) {
    const title = document.getElementById("post-title").value.trim();
    const desc = document.getElementById("post-desc").value.trim();
    let finalContent = title ? `**${title}**\n\n${desc}` : desc;

    try {
        const res = await authFetch(`/api/community/${communityId}/posts/${postId}`, {
            method: "PATCH",
            body: JSON.stringify({ content: finalContent })
        });

        if (res.ok) {
            closeCreateModal();
            const btn = document.querySelector("button[onclick^='savePostEdit']");
            btn.innerText = "Post";
            btn.setAttribute("onclick", "submitNewPost()");

            window.refreshFeed(window.currentCommunityId);
        }
    } catch (e) { console.error(e); }
}

async function editComment(communityId, postId, commentId, currentContent) {
    const newContent = prompt("Edit your comment:", currentContent);
    if (newContent === null || newContent.trim() === "" || newContent === currentContent) return;
    try {
        const res = await authFetch(`/api/community/${communityId}/posts/${postId}/comments/${commentId}`, {
            method: "PATCH",
            body: JSON.stringify({ content: newContent.trim() })
        });
        if (res.ok) {
            toggleComments(communityId, postId, true);
        }
    } catch (e) { console.error(e); }
}