async function toggleLike(element) {
    const postId = element.getAttribute('data-post-id');
    const communityId = element.getAttribute('data-community-id');
    
    const heartBtn = element.querySelector(".heart-btn");
    const countSpan = element.querySelector(".count-text");

    if (!heartBtn || !countSpan) return;

    let count = parseInt(countSpan.innerText) || 0;

    if (heartBtn.classList.contains("liked")) {
        heartBtn.classList.remove("liked");
        countSpan.innerText = `${count - 1} Likes`;
    } else {
        heartBtn.classList.add("liked");
        countSpan.innerText = `${count + 1} Likes`;
    }

    try {
        await fetch(`/api/community/${communityId}/posts/${postId}/likes`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) { 
        console.error("Like failed:", err);
    }
}

async function toggleCommentLike(element, communityId, postId, commentId) {
    if(event) event.stopPropagation();

    const heartBtn = element.querySelector(".heart-btn");
    const countSpan = element.querySelector(".count-text");

    if (!heartBtn || !countSpan) return;

    let count = parseInt(countSpan.innerText) || 0;

    if (heartBtn.classList.contains("liked")) {
        heartBtn.classList.remove("liked");
        // Don't show "0", just show empty if 0
        countSpan.innerText = count > 1 ? count - 1 : "";
    } else {
        heartBtn.classList.add("liked");
        countSpan.innerText = count + 1;
    }

    try {
        await fetch(`/api/community/${communityId}/posts/${postId}/comments/${commentId}/likes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) { console.error(err); }
}

async function toggleComments(element) {
    const postId = element.getAttribute('data-post-id');
    const communityId = element.getAttribute('data-community-id');
    const section = document.getElementById(`comments-${postId}`);

    if (!section) return;

    if (section.style.display === "block") {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    section.innerHTML = `<div style="padding:20px; text-align:center; color:#888;">Loading...</div>`;

    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}/comments`);
        const data = await res.json();

        section.innerHTML = "";

        if (data.comments && data.comments.length > 0) {
            data.comments.forEach(c => {
                const isLiked = c.isLiked || c.isLikedByViewer;
                const likeClass = isLiked ? 'liked' : '';
                const likeCount = c.likeCount > 0 ? c.likeCount : '';

                section.innerHTML += `
                    <div style="display:flex; gap:10px; margin-bottom:15px; align-items: flex-start;">
                        <a href="/user/${c.author.userId}">
                            <img src="${c.author.avatarUrl || 'https://placehold.co/30'}" 
                                 style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                        </a>
                        
                        <div style="flex: 1;">
                            <div style="background:#f0f2f5; padding:8px 12px; border-radius:15px; display:inline-block;">
                                <a href="/user/${c.author.userId}" style="text-decoration:none; color:inherit;">
                                    <strong style="font-size:13px; cursor:pointer;">${c.author.displayName}</strong>
                                </a>
                                <div style="margin-top:2px; font-size:14px;">${c.content}</div>
                            </div>
                            
                            <div style="display:flex; gap:10px; margin-left:4px; margin-top:4px; align-items:center;">
                                <div class="footer-section" style="padding:0; flex:none; background:none;" 
                                     onclick="toggleCommentLike(this, ${communityId}, ${postId}, ${c.commentId})">
                                    <div class="heart-btn ${likeClass}" style="width:14px; height:14px;">
                                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    </div>
                                    <span class="count-text" style="font-size:11px;">${likeCount}</span>
                                </div>
                                <span style="font-size:11px; color:#65676B;">${new Date(c.created).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            section.innerHTML += `<div style="padding:10px; color:#888; font-style:italic; font-size:13px;">No comments yet.</div>`;
        }
        section.innerHTML += `
            <div style="display:flex; gap:10px; margin-top:15px; border-top:1px solid #f0f2f5; padding-top:15px;">
                <input type="text" id="input-${postId}" placeholder="Write a comment..." class="form-input" 
                       style="margin-bottom:0; border-radius:20px;">
                <button onclick="submitComment(${communityId}, ${postId})" 
                        class="post-submit-btn" style="padding:8px 16px; font-size:12px;">
                    Post
                </button>
            </div>`;

    } catch (e) {
        section.innerHTML = `<div style="color:red; padding:10px;">Error loading comments.</div>`;
    }
}

async function submitComment(communityId, postId) {
    const input = document.getElementById(`input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;

    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content })
        });

        if (res.ok) {
            input.value = "";

            const parent = document.getElementById(`post-${postId}`);
            const commBtn = parent.querySelector('.footer-section[onclick^="toggleComments"]');

            toggleComments(commBtn).then(() => {
                toggleComments(commBtn);
            });
        }
    } catch (err) {
        console.error("Comment failed:", err);
        alert("Failed to post comment.");
    }
}