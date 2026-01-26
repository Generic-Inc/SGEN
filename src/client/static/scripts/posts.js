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

                const isOwner = (window.currentUserId && window.currentUserId === c.author.userId);

                let menuHtml = '';
                if (isOwner) {
                    menuHtml = `
                    <div class="post-options" style="position: relative; margin-left: auto;">
                        <button onclick="toggleCommentMenu(${c.commentId})" style="background:none; border:none; cursor:pointer; color:#65676B; padding: 4px;">
                            <span class="material-icons" style="font-size: 16px;">more_horiz</span>
                        </button>
                        <div id="comment-menu-${c.commentId}" class="menu-dropdown" style="display:none; position:absolute; right:0; top:20px; background:white; border:1px solid #ddd; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); z-index:10; width:100px;">
                            <div onclick="enableEditComment(${c.commentId}, ${postId}, ${communityId})" style="padding:8px; cursor:pointer; font-size:12px; border-bottom:1px solid #eee;">Edit</div>
                            <div onclick="deleteComment(${c.commentId}, ${postId}, ${communityId})" style="padding:8px; cursor:pointer; font-size:12px; color:red;">Delete</div>
                        </div>
                    </div>`;
                }

                section.innerHTML += `
                    <div id="comment-row-${c.commentId}" style="display:flex; gap:10px; margin-bottom:15px; align-items: flex-start;">
                        <a href="/user/${c.author.userId}">
                            <img src="${c.author.avatarUrl || 'https://placehold.co/30'}" 
                                 style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                        </a>
                        
                        <div style="flex: 1;">
                            <div style="display:flex; align-items: flex-start; gap: 8px;">
                                <div id="comment-bubble-${c.commentId}" style="background:#f0f2f5; padding:8px 12px; border-radius:15px; display:inline-block;">
                                    <a href="/user/${c.author.userId}" style="text-decoration:none; color:inherit;">
                                        <strong style="font-size:13px; cursor:pointer;">${c.author.displayName}</strong>
                                    </a>
                                    <div class="comment-text-body" style="margin-top:2px; font-size:14px;">${c.content}</div>
                                </div>
                                ${menuHtml}
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

            // Refresh comments
            toggleComments(commBtn).then(() => {
                toggleComments(commBtn);
            });
        }
    } catch (err) {
        console.error("Comment failed:", err);
        alert("Failed to post comment.");
    }
}

function togglePostMenu(postId) {
    const menu = document.getElementById(`post-menu-${postId}`);
    if (menu) {
        // Close others
        document.querySelectorAll('.menu-dropdown').forEach(el => {
            if (el.id !== `post-menu-${postId}`) el.style.display = 'none';
        });
        menu.style.display = (menu.style.display === "none") ? "block" : "none";
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.post-options')) {
        document.querySelectorAll('.menu-dropdown').forEach(el => el.style.display = 'none');
    }
});

async function deletePost(postId, communityId) {
    if(!confirm("Are you sure you want to delete this post?")) return;

    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            const card = document.getElementById(`post-${postId}`);
            if(card) card.remove();
        } else {
            alert("Failed to delete post.");
        }
    } catch (e) { console.error(e); }
}

function enableEditPost(postId, communityId) {
    const contentDiv = document.getElementById(`post-content-${postId}`);
    const textP = contentDiv.querySelector('.post-text-body');
    const currentText = textP.innerText;

    contentDiv.innerHTML = `
        <textarea id="edit-area-${postId}" class="form-input" style="min-height:80px; width:100%; font-family:inherit;">${currentText}</textarea>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <button class="post-submit-btn" onclick="savePostEdit(${postId}, ${communityId})">Save</button>
            <button class="btn-secondary" onclick="cancelPostEdit(${postId}, '${currentText.replace(/'/g, "\\'")}')">Cancel</button>
        </div>
        ${contentDiv.innerHTML.includes('<img') ? contentDiv.querySelector('img').outerHTML : ''}
    `;

    document.getElementById(`post-menu-${postId}`).style.display = 'none';
}

function cancelPostEdit(postId, originalText) {
    const contentDiv = document.getElementById(`post-content-${postId}`);
    const imgHtml = contentDiv.querySelector('img') ? contentDiv.querySelector('img').outerHTML : '';

    contentDiv.innerHTML = `
        <p class="post-text-body">${originalText}</p>
        ${imgHtml}
    `;
}

async function savePostEdit(postId, communityId) {
    const newContent = document.getElementById(`edit-area-${postId}`).value;

    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newContent })
        });

        if (res.ok) {
            const data = await res.json();
            const contentDiv = document.getElementById(`post-content-${postId}`);
            const imgHtml = contentDiv.querySelector('img') ? contentDiv.querySelector('img').outerHTML : '';
            contentDiv.innerHTML = `
                <p class="post-text-body">${data.content}</p>
                ${imgHtml}
            `;
            const headerInfo = document.querySelector(`#post-${postId} .post-info span`);
            if (headerInfo && !headerInfo.innerText.includes("Edited")) {
                headerInfo.innerHTML += ` <span style="font-style: italic; margin-left: 5px;">(Edited)</span>`;
            }
        }
    } catch (e) { console.error(e); }
}

function toggleCommentMenu(commentId) {
    const menu = document.getElementById(`comment-menu-${commentId}`);
    if (menu) menu.style.display = (menu.style.display === "none") ? "block" : "none";
}

async function deleteComment(commentId, postId, communityId) {
    if(!confirm("Delete this comment?")) return;
    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
        if(res.ok) document.getElementById(`comment-row-${commentId}`).remove();
    } catch(e) { console.error(e); }
}

function enableEditComment(commentId, postId, communityId) {
    const bubble = document.getElementById(`comment-bubble-${commentId}`);
    const textDiv = bubble.querySelector('.comment-text-body');
    const currentText = textDiv.innerText;

    bubble.innerHTML = `
        <input type="text" id="edit-comment-${commentId}" value="${currentText}" 
               style="border:1px solid #ddd; border-radius:8px; padding:4px; font-size:14px; width:100%;">
        <div style="font-size:10px; margin-top:4px;">
            <a href="#" onclick="saveCommentEdit(${commentId}, ${postId}, ${communityId}); return false;">Save</a> | 
            <a href="#" onclick="toggleComments(document.querySelector('[data-post-id=\\'${postId}\\']')); return false;">Cancel</a>
        </div>
    `;
    document.getElementById(`comment-menu-${commentId}`).style.display = 'none';
}

async function saveCommentEdit(commentId, postId, communityId) {
    const newContent = document.getElementById(`edit-comment-${commentId}`).value;
    try {
        const res = await fetch(`/api/community/${communityId}/posts/${postId}/comments/${commentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newContent })
        });
        if(res.ok) {
            const parent = document.getElementById(`post-${postId}`);
            const commBtn = parent.querySelector('.footer-section[onclick^="toggleComments"]');
            toggleComments(commBtn).then(() => toggleComments(commBtn));
        }
    } catch(e) { console.error(e); }
}