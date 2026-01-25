document.addEventListener("DOMContentLoaded", () => {
    console.log("SGEN Client Loaded! 🚀");
    initApp();
});

let USER_TOKEN = localStorage.getItem("sgen_token");

function initApp() {
    if (!USER_TOKEN) {
        document.getElementById("login-overlay").style.display = "flex";
    } else {
        document.getElementById("login-overlay").style.display = "none";
        loadHomeFeed();
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
        window.location.reload();
    }
    return response;
}

async function handleLogin() {
    const usernameInput = document.getElementById("login-username").value;
    const passwordInput = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");
    const btn = document.querySelector("#login-overlay button");

    errorDiv.innerText = "";
    btn.disabled = true;
    btn.innerText = "Logging in...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            USER_TOKEN = data.token;
            localStorage.setItem("sgen_token", USER_TOKEN);
            location.reload();
        } else {
            errorDiv.innerText = data.error || "Login failed";
            btn.disabled = false;
            btn.innerText = "Log In";
        }
    } catch (err) {
        console.error(err);
        errorDiv.innerText = "Connection error";
        btn.disabled = false;
        btn.innerText = "Log In";
    }
}

async function loadHomeFeed() {
    const commMenu = document.getElementById("community-menu");
    if(commMenu) commMenu.style.display = "none";
    const homeCard = document.getElementById("home-card");
    const infoCard = document.getElementById("info-card");
    if(homeCard) homeCard.style.display = "block";
    if(infoCard) infoCard.style.display = "none";
    document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");

    const feedContainer = document.getElementById("feed-content");
    feedContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Your Feed...</div>`;

    try {
        const response = await authFetch(`/api/feed`);
        const data = await response.json();
        renderFeed(data.posts, feedContainer, true);
    } catch (error) {
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Failed to load feed.</div>`;
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
                <div class="community-item" onclick="loadCommunityFeed(${comm.communityId}, this)">
                    <span class="material-icons">groups</span>
                    <span>${comm.displayName}</span>
                </div>`;
            listContainer.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) { console.error("Sidebar error:", error); }
}

async function loadCommunityFeed(communityId, element) {
    const commMenu = document.getElementById("community-menu");
    if(commMenu) commMenu.style.display = "block";
    const homeCard = document.getElementById("home-card");
    const infoCard = document.getElementById("info-card");
    if(homeCard) homeCard.style.display = "none";
    if(infoCard) infoCard.style.display = "block";

    if(element) {
        document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");
        element.style.backgroundColor = "#e8f0fe";
    }

    try {
        const res = await authFetch(`/api/community/${communityId}`);
        if(res.ok) {
            const data = await res.json();
            if(document.getElementById("info-title")) document.getElementById("info-title").innerText = data.displayName;
            if(document.getElementById("info-desc")) document.getElementById("info-desc").innerText = data.description || "";
            if(document.getElementById("info-members")) document.getElementById("info-members").innerText = `${data.memberCount} Members`;
            if(document.getElementById("nav-chat-label")) document.getElementById("nav-chat-label").innerText = `${data.displayName} Chat`;
            if(document.getElementById("nav-events-label")) document.getElementById("nav-events-label").innerText = `${data.displayName} Events`;
        }
    } catch (err) {}

    const feedContainer = document.getElementById("feed-content");
    feedContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Community...</div>`;

    try {
        const response = await authFetch(`/api/community/${communityId}/posts`);
        const data = await response.json();
        renderFeed(data.posts, feedContainer, false);
    } catch (error) {
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Error loading community.</div>`;
    }
}