async function createPost() {
    if (!CURRENT_COMMUNITY_ID) {
        alert("Please select a community first!");
        return;
    }

    const input = document.getElementById("new-post-content");
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await authFetch(`/api/community/${CURRENT_COMMUNITY_ID}/posts`, {
            method: "POST",
            body: JSON.stringify({ content: content })
        });

        if (res.ok) {
            input.value = "";
            loadCommunityFeed(CURRENT_COMMUNITY_ID);
        } else {
            const err = await res.json();
            alert(err.error || "Failed to post");
        }
    } catch (e) {
        console.error(e);
        alert("Connection error");
    }
}


// ==========================================
// 2. COMMENT CREATION
// ==========================================
async function submitComment(postId, inputElement) {
    const content = inputElement.value.trim();
    if (!content) return;

    // We need the community ID.
    // If we are on Home Feed, we might not have CURRENT_COMMUNITY_ID set correctly for *that specific post*.
    // However, for now, let's assume we use the one from the post object or the current view.
    // The backend route requires community_id in the URL: /api/community/<id>/...

    // HACK: Since we don't easily have the community ID here without passing it everywhere,
    // let's rely on CURRENT_COMMUNITY_ID.
    // (Note: This means commenting from Home Feed might be tricky if the post is from a different community.
    //  For a robust fix, we should attach communityId to the post HTML element.)

    if (!CURRENT_COMMUNITY_ID) {
        alert("Please enter the community to comment.");
        return;
    }

    try {
        const res = await authFetch(`/api/community/${CURRENT_COMMUNITY_ID}/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ content: content })
        });

        if (res.ok) {
            inputElement.value = ""; // Clear
            toggleComments(CURRENT_COMMUNITY_ID, postId, true); // Refresh comments (Force open)
        }
    } catch (e) { console.error(e); }
}

function handleCommentKey(event, postId, inputElement) {
    if (event.key === "Enter") {
        submitComment(postId, inputElement);
    }
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
                    
                    <input type="text" 
                           placeholder="Write a comment..." 
                           onkeydown="handleCommentKey(event, ${postId}, this)"
                           style="flex:1; border:none; background:transparent; outline:none;">
                    
                    <i class="fa-regular fa-paper-plane" 
                       onclick="submitComment(${postId}, this.previousElementSibling)"
                       style="color:#65676B; cursor:pointer;"></i>
                 </div>
            </div>`;

    } catch(e) { section.innerHTML = "Error loading comments."; }
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