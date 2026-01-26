document.addEventListener("DOMContentLoaded", () => {
    console.log("SGEN Client Loaded");
    initApp();
});

let USER_TOKEN = localStorage.getItem("sgen_token");

window.currentCommunityId = null;

function initApp() {
    if (window.location.pathname === '/login') return;
    if (!USER_TOKEN) {
        window.location.href = "/login";
    } else {
        loadHome();
        loadMyCommunities();
    }
}

async function authFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (USER_TOKEN) {
        options.headers['Authorization'] = USER_TOKEN;
    }
    options.headers['Content-Type'] = 'application/json';

    const response = await fetch(url, options);

    if (response.status === 401) {
        console.warn("Session expired. Logging out.");
        localStorage.removeItem("sgen_token");
        window.location.href = "/login";
    }
    return response;
}

async function handleLogin() {
    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");
    const errorDiv = document.getElementById("login-error");

    if (!usernameInput.value || !passwordInput.value) {
        errorDiv.innerText = "Please enter both username and password.";
        return;
    }

    errorDiv.innerText = "Logging in...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem("sgen_token", data.token);
            window.location.href = "/";
        } else {
            errorDiv.innerText = data.error || "Login failed";
        }
    } catch (err) {
        console.error(err);
        errorDiv.innerText = "Connection error.";
    }
}

async function loadHome() {
    window.currentCommunityId = null;
    toggleView("home");
    if(window.refreshFeed) window.refreshFeed();
}

async function openCommunity(communityId, element) {
    document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");
    if(element) element.style.backgroundColor = "#e8f0fe";

    // If coming from profile, force view switch back to community
    window.currentCommunityId = communityId;
    toggleView("community");

    loadCommunityHeader(communityId);
    if(window.refreshFeed) window.refreshFeed(communityId);
}

function toggleView(mode) {
    const commMenu = document.getElementById("community-menu");
    const homeCard = document.getElementById("home-card");
    const infoCard = document.getElementById("info-card");

    // View Containers
    const feedContainer = document.getElementById("feed-container");
    const profileView = document.getElementById("profile-view");

    // Hide all main views first
    if(feedContainer) feedContainer.style.display = "block";
    if(profileView) profileView.style.display = "none";

    // Standard sidebars default
    if(commMenu) commMenu.style.display = "none";
    if(homeCard) homeCard.style.display = "block";
    if(infoCard) infoCard.style.display = "none";

    if (mode === "home") {
        // default state set above
    }
    else if (mode === "community") {
        if(commMenu) commMenu.style.display = "block";
        if(homeCard) homeCard.style.display = "none";
        if(infoCard) infoCard.style.display = "block";
    }
    else if (mode === "profile") {
        if(feedContainer) feedContainer.style.display = "none";
        if(profileView) profileView.style.display = "block";

        // Hide sidebar elements for clean look
        if(homeCard) homeCard.style.display = "none";
        if(infoCard) infoCard.style.display = "none";
        if(commMenu) commMenu.style.display = "none";
    }
}

async function loadMyCommunities() {
    const listContainer = document.getElementById("my-communities-list");
    if (!listContainer) return;

    try {
        const response = await authFetch('/api/my-communities');
        const data = await response.json();
        listContainer.innerHTML = "";

        if (!data.communities || data.communities.length === 0) {
            listContainer.innerHTML = `<div style="padding: 10px 24px; color: #999; font-size: 13px; font-style: italic;">Not in any communities yet.</div>`;
            return;
        }

        data.communities.forEach(comm => {
            const html = `
                <div class="community-item" onclick="openCommunity(${comm.communityId}, this)">
                    <span class="material-icons">groups</span>
                    <span>${comm.displayName}</span>
                </div>`;
            listContainer.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) { console.error("Sidebar error:", error); }
}

async function loadCommunityHeader(communityId) {
    try {
        const res = await authFetch(`/api/community/${communityId}`);
        if(res.ok) {
            const data = await res.json();
            setText("info-title", data.displayName);
            setText("info-desc", data.description);
            setText("info-members", `${data.memberCount} Members`);
            setText("nav-chat-label", `${data.displayName} Chat`);
            setText("nav-events-label", `${data.displayName} Events`);
        }
    } catch (err) { console.error("Header load failed", err); }
}

window.refreshFeed = async function(communityId = null) {
    const feedContainer = document.getElementById("feed-content");
    if(!feedContainer) return;

    feedContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Feed...</div>`;

    let url = communityId ? `/api/community/${communityId}/posts` : `/api/feed`;
    let isHome = !communityId;

    try {
        const response = await authFetch(url);
        const data = await response.json();

        if(typeof renderFeed === "function") {
            renderFeed(data.posts, feedContainer, isHome);
        }
    } catch (error) {
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Failed to load feed.</div>`;
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text || "";
}

// NEW FUNCTION: Fetch and display user profile
async function loadUserProfile(userId) {
    toggleView("profile");

    // 1. Reset UI
    document.getElementById("profile-view-name").innerText = "Loading...";
    document.getElementById("profile-view-bio").innerText = "";
    document.getElementById("profile-communities-list").innerHTML = '<div style="padding:20px; text-align:center;">Loading communities...</div>';
    document.getElementById("profile-view-avatar").src = "https://placehold.co/100";
    document.getElementById("profile-view-joined").innerText = "-";

    try {
        // 2. Fetch Basic User Info
        const userRes = await authFetch(`/api/user/${userId}`);
        if (!userRes.ok) throw new Error("User not found");
        const userData = await userRes.json();

        // 3. Populate Info
        document.getElementById("profile-view-name").innerText = userData.displayName || userData.username;
        document.getElementById("profile-view-bio").innerText = userData.bio || "No bio available.";
        document.getElementById("profile-view-avatar").src = userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;

        if (userData.created) {
            const date = new Date(userData.created).toLocaleDateString();
            document.getElementById("profile-view-joined").innerText = date;
        }

        // 4. Fetch User's Communities
        const commRes = await authFetch(`/api/user/${userId}/communities`);
        const commData = await commRes.json();
        const commList = document.getElementById("profile-communities-list");

        commList.innerHTML = "";

        if (!commData.communities || commData.communities.length === 0) {
            commList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#999; font-style:italic;">Not a member of any communities.</div>`;
        } else {
            commData.communities.forEach(c => {
                commList.innerHTML += `
                    <div class="profile-comm-card" onclick="openCommunity(${c.communityId})">
                        <div class="material-icons" style="font-size:32px; color:#FF4500;">groups</div>
                        <div class="profile-comm-name">${c.displayName}</div>
                    </div>
                `;
            });
        }

    } catch (e) {
        console.error(e);
        alert("Failed to load user profile.");
        loadHome();
    }
}

async function openMyProfile() {
    try {
        const res = await authFetch('/api/user/me');

        if (res.ok) {
            const myData = await res.json();
            // 2. Load the profile view using my ID
            loadUserProfile(myData.userId);
        } else {
            console.error("Failed to fetch my profile");
            alert("Please log in again.");
        }
    } catch (e) {
        console.error("Profile error:", e);
    }
}