async function generateMyCommunities() {
    const communities = await fetchCommunities();
    const container = document.getElementById("my-communities-list");
    for (const community of communities) {
        const communityElement = document.createElement("div");
        communityElement.classList.add("community-item");
        communityElement.innerHTML = `<span class="material-icons">groups</span>
<span>${community.displayName}</span>`
        communityElement.onclick = function() {
            window.location.href = `/community/${community.communityId}`;
        };
        container.appendChild(communityElement);
    }
}
console.log("test")

async function loadUserProfile(userId) {
    const commList = document.getElementById("user-communities-list");
    if (!commList) return;

    try {
        const userRes = await fetch(`/api/user/${userId}`);
        const user = await userRes.json();

        if (userRes.ok) {
            document.getElementById("profile-avatar").src = user.avatarUrl || 'https://placehold.co/120';
            document.getElementById("profile-display-name").innerText = user.displayName;
            document.getElementById("profile-username").innerText = `@${user.username}`;

            const rawBio = user.bio || "No bio yet.";
            document.getElementById("profile-bio").innerText = rawBio.replace("{display_name}", user.displayName);

            const joinDate = new Date(user.created);
            document.getElementById("profile-joined").innerText = joinDate.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
        }

        const commRes = await fetch(`/api/user/${userId}/communities`);
        const data = await commRes.json();

        commList.innerHTML = "";
        if (!data.communities || data.communities.length === 0) {
            commList.innerHTML = `<p style="color: #8a8d91; font-style: italic; font-size: 14px; padding: 10px;">No communities joined yet.</p>`;
            return;
        }

        data.communities.forEach(comm => {
            commList.innerHTML += `
                <div class="community-card-mini" onclick="window.location.href='/community/${comm.communityId}'" 
                     style="text-align: center; padding: 15px; border: 1px solid #e4e6eb; border-radius: 10px; cursor: pointer; transition: background 0.2s;">
                    <img src="${comm.iconUrl || 'https://placehold.co/50'}" style="width: 50px; height: 50px; border-radius: 10px; margin-bottom: 10px;">
                    <h4 style="margin: 0; font-size: 13px; color: #1c1e21; font-weight: 600;">${comm.displayName}</h4>
                    <p style="font-size: 11px; color: #65676B; margin-top: 4px;">${comm.memberCount} Members</p>
                </div>
            `;
        });

    } catch (e) {
        console.error("Profile load failed:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.targetUserId) {
        console.log("Loading profile for user:", window.targetUserId);
        loadUserProfile(window.targetUserId);
    }
});