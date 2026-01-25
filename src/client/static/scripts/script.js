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
            window.location.reload();
        }
        return response;
    }

    async function handleLogin() {
        const usernameInput = document.getElementById("login-username").value;
        const passwordInput = document.getElementById("login-password").value;
        const errorDiv = document.getElementById("login-error");
        const btn = document.querySelector("#login-overlay button");

        const loginData = {password: passwordInput};
        if (usernameInput.includes("@")) {
            loginData.email = usernameInput;
        } else {
            loginData.username = usernameInput;
        }
        errorDiv.innerText = "";
        btn.disabled = true;
        btn.innerText = "Logging in...";
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
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok && data.token) {
                USER_TOKEN = data.token;
                localStorage.setItem("sgen_token", USER_TOKEN);
                location.href = "/";
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
    }

async function openCommunity(communityId, element) {
    document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");
    if(element) element.style.backgroundColor = "#e8f0fe";
    if (window.currentCommunityId === communityId) {
        if(window.refreshFeed) window.refreshFeed(communityId);
        return;
    }
    async function handleSignup() {
        const usernameInput = document.getElementById("signup-username").value;
        const emailInput = document.getElementById("signup-email").value;
        const passwordInput = document.getElementById("signup-password").value;
        const confirmPasswordInput = document.getElementById("signup-confirm-password").value;
        const errorDiv = document.getElementById("signup-error");
        const btn = document.querySelector("#login-overlay button");
        if (passwordInput !== confirmPasswordInput) {
            errorDiv.innerText = "Passwords do not match";
            return;
        }
        const signupData = {
            username: usernameInput,
            displayName: usernameInput,
            email: emailInput,
            password: passwordInput
        };
        btn.disabled = true;
        btn.innerText = "Signing up...";

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(signupData)
            });
            const data = await response.json();
            if (response.ok) {
                const overlayContent = document.querySelector("#login-overlay > div");
                overlayContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <img src="https://i.ibb.co/G4f7zGH5/SGEN-Logo.png" style="height: 100px">
                    <div style="font-size: 24px; font-weight: bold; color: #d93025; margin-top: 10px;">Verify Your Email</div>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">An OTP has been sent to <strong>${emailInput}</strong>.</p>
                </div>
                <input type="text" id="otp-code" placeholder="Enter OTP *" class="login-bar" style="margin-bottom: 20px">
                <button onclick="handleOtpVerification('${emailInput}')"
                        style="width: 100%; padding: 12px; background: #d93025; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                    Verify
                </button>
                <div id="otp-error" style="color: red; margin-top: 15px; font-size: 14px;"></div>
            `;
            } else {
                errorDiv.innerText = data.error || "Signup failed";
                btn.disabled = false;
                btn.innerText = "Sign Up";
            }
    window.currentCommunityId = communityId;
    toggleView("community");

        } catch (err) {
            console.error(err);
            errorDiv.innerText = "Connection error";
            btn.disabled = false;
            btn.innerText = "Sign Up";
        }
    }

    async function handleOtpVerification(email) {
        const otpInput = document.getElementById("otp-code").value;
        const errorDiv = document.getElementById("otp-error");
        const btn = document.querySelector("#login-overlay button");

        btn.disabled = true;
        btn.innerText = "Verifying...";
        errorDiv.innerText = "";
    loadCommunityHeader(communityId);
    if(window.refreshFeed) window.refreshFeed(communityId);
}

        try {
            const response = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: email, verificationCode: otpInput})
            });

            const data = await response.json();

            if (response.ok && data.token) {
                USER_TOKEN = data.token;
                localStorage.setItem("sgen_token", USER_TOKEN);
                window.location.href = "/";
            } else {
                errorDiv.innerText = data.error || "Invalid OTP";
                btn.disabled = false;
                btn.innerText = "Verify";
            }
        } catch (err) {
            console.error(err);
            errorDiv.innerText = "Connection error";
            btn.disabled = false;
            btn.innerText = "Verify";
        }
    }


    async function loadHomeFeed() {
        const commMenu = document.getElementById("community-menu");
        if (commMenu) commMenu.style.display = "none";
        const homeCard = document.getElementById("home-card");
        const infoCard = document.getElementById("info-card");
        if (homeCard) homeCard.style.display = "block";
        if (infoCard) infoCard.style.display = "none";
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
                <div class="community-item" onclick="loadCommunityFeed(${comm.communityId}, this)">
        data.communities.forEach(comm => {
            const html = `
                <div class="community-item" onclick="openCommunity(${comm.communityId}, this)">
                    <span class="material-icons">groups</span>
                    <span>${comm.displayName}</span>
                </div>`;
                listContainer.insertAdjacentHTML('beforeend', html);
            });
        } catch (error) {
            console.error("Sidebar error:", error);
        }
    }

    async function loadCommunityFeed(communityId, element) {
        const commMenu = document.getElementById("community-menu");
        if (commMenu) commMenu.style.display = "block";
        const homeCard = document.getElementById("home-card");
        const infoCard = document.getElementById("info-card");
        if (homeCard) homeCard.style.display = "none";
        if (infoCard) infoCard.style.display = "block";

        if (element) {
            document.querySelectorAll('.community-item').forEach(el => el.style.backgroundColor = "transparent");
            element.style.backgroundColor = "#e8f0fe";
        }

        try {
            const res = await authFetch(`/api/community/${communityId}`);
            if (res.ok) {
                const data = await res.json();
                if (document.getElementById("info-title")) document.getElementById("info-title").innerText = data.displayName;
                if (document.getElementById("info-desc")) document.getElementById("info-desc").innerText = data.description || "";
                if (document.getElementById("info-members")) document.getElementById("info-members").innerText = `${data.memberCount} Members`;
                if (document.getElementById("nav-chat-label")) document.getElementById("nav-chat-label").innerText = `${data.displayName} Chat`;
                if (document.getElementById("nav-events-label")) document.getElementById("nav-events-label").innerText = `${data.displayName} Events`;
            }
        } catch (err) {
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

        const feedContainer = document.getElementById("feed-content");
        feedContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Community...</div>`;
window.refreshFeed = async function(communityId = null) {
    const feedContainer = document.getElementById("feed-content");
    if(!feedContainer) return;

    feedContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Feed...</div>`;

    let url = communityId ? `/api/community/${communityId}/posts` : `/api/feed`;
    let isHome = !communityId;

        try {
            const response = await authFetch(`/api/community/${communityId}/posts`);
            const data = await response.json();
            renderFeed(data.posts, feedContainer, false);
        } catch (error) {
            feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Error loading community.</div>`;
        }
    }
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