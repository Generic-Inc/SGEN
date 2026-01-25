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
    if (window.currentCommunityId === communityId) {
        if(window.refreshFeed) window.refreshFeed(communityId);
        return;
    }

    window.currentCommunityId = communityId;
    toggleView("community");

    loadCommunityHeader(communityId);
    if(window.refreshFeed) window.refreshFeed(communityId);
}

function toggleView(mode) {
    const commMenu = document.getElementById("community-menu");
    const homeCard = document.getElementById("home-card");
    const infoCard = document.getElementById("info-card");

    if (mode === "home") {
        if(commMenu) commMenu.style.display = "none";
        if(homeCard) homeCard.style.display = "block";
        if(infoCard) infoCard.style.display = "none";
    } else {
        if(commMenu) commMenu.style.display = "block";
        if(homeCard) homeCard.style.display = "none";
        if(infoCard) infoCard.style.display = "block";
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