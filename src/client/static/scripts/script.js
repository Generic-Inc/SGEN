document.addEventListener("DOMContentLoaded", () => {
    console.log("SGEN Client Initializing... 🚀");
    initApp();
});

window.currentCommunityId = null;

/**
 * The "Bulletproof" fetcher.
 * Fixes the 'Cannot set properties of undefined' error.
 */
async function authFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Content-Type'] = 'application/json';

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            console.warn("Session expired. Redirecting.");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
        }
        return response;
    } catch (e) {
        console.error("Fetch failed:", e);
        throw e;
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text || "";
}

async function initApp() {
    const path = window.location.pathname;

    if (path === '/login' || path === '/signup') return;

    const sidebar = document.getElementById("my-communities-list");
    if (sidebar) {
        await loadMyCommunities();
    }

    if (path === "/") {
        loadHome();
    }
}

async function handleLogin() {
    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");
    const errorDiv = document.getElementById("login-error");
    const btn = document.querySelector("#login-overlay button") || document.querySelector("button");

    if (!usernameInput || !passwordInput || !usernameInput.value || !passwordInput.value) {
        if(errorDiv) errorDiv.innerText = "Please enter credentials.";
        return;
    }

    const loginData = { password: passwordInput.value };
    if (usernameInput.value.includes("@")) {
        loginData.email = usernameInput.value;
    } else {
        loginData.username = usernameInput.value;
    }

    if(btn) { btn.disabled = true; btn.innerText = "Logging in..."; }

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = "/";
        } else {
            if(errorDiv) errorDiv.innerText = data.error || "Login failed";
            if(btn) { btn.disabled = false; btn.innerText = "Log In"; }
        }
    } catch (err) {
        if(errorDiv) errorDiv.innerText = "Connection error.";
        if(btn) { btn.disabled = false; btn.innerText = "Log In"; }
    }
}

async function handleSignup() {
    const usernameInput = document.getElementById("signup-username").value;
    const emailInput = document.getElementById("signup-email").value;
    const passwordInput = document.getElementById("signup-password").value;
    const confirmInput = document.getElementById("signup-confirm-password").value;
    const errorDiv = document.getElementById("signup-error");

    if (passwordInput !== confirmInput) {
        errorDiv.innerText = "Passwords do not match";
        return;
    }

    try {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: usernameInput,
                displayName: usernameInput,
                email: emailInput,
                password: passwordInput
            })
        });
        const data = await response.json();

        if (response.ok) {
            const card = document.querySelector(".login-card") || document.querySelector("#login-overlay > div");
            if(card) {
                card.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size: 40px;">🦁</div>
                    <h2>Verify OTP</h2>
                    <p>Sent to <strong>${emailInput}</strong></p>
                    <input type="text" id="otp-code" placeholder="Enter OTP" class="login-bar">
                    <button onclick="handleOtpVerification('${emailInput}')" class="post-submit-btn" style="width:100%">Verify</button>
                    <div id="otp-error" style="color:red; margin-top:10px;"></div>
                </div>`;
            }
        } else {
            errorDiv.innerText = data.error || "Signup failed";
        }
    } catch (err) { errorDiv.innerText = "Connection error"; }
}

async function handleOtpVerification(email) {
    const otp = document.getElementById("otp-code").value;
    try {
        const res = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: email, verificationCode: otp})
        });
        if (res.ok) window.location.href = "/";
        else document.getElementById("otp-error").innerText = "Invalid OTP";
    } catch (err) { console.error(err); }
}

async function loadHome() {
    window.currentCommunityId = null;
    toggleView("home");
}

function toggleView(mode) {
    const commMenu = document.getElementById("community-menu");
    const welcomeSection = document.getElementById("home-welcome-section");

    if (mode === "home") {
        if (commMenu) commMenu.style.display = "none";
        if (welcomeSection) welcomeSection.style.display = "block";
    } else {
        if (commMenu) commMenu.style.display = "block";
        if (welcomeSection) welcomeSection.style.display = "none";
    }
}

async function loadMyCommunities() {
    const container = document.getElementById("my-communities-list");
    if (!container) return;

    try {
        const response = await authFetch('/api/user/communities');
        const data = await response.json();

        container.innerHTML = "";

        if (!data.communities || data.communities.length === 0) {
            container.innerHTML = `<div style="padding:10px 24px; color:#999; font-size:13px;">No communities yet.</div>`;
            return;
        }

        data.communities.forEach(comm => {
            container.insertAdjacentHTML('beforeend', `
                <div class="nav-item" onclick="window.location.href='/community/${comm.communityId}'">
                    <span class="material-icons">groups</span>
                    <span>${comm.displayName}</span>
                </div>`);
        });
    } catch (error) { console.error("Sidebar error:", error); }
}

window.refreshFeed = async function(communityId = null) {
    const feedContainer = document.getElementById("feed-content");
    if(!feedContainer) return;

    feedContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Loading Feed...</div>`;

    let url = communityId ? `/api/community/${communityId}/posts` : `/api/feed`;
    try {
        const response = await authFetch(url);
        const data = await response.json();
        if(typeof renderFeed === "function") {
            renderFeed(data.posts, feedContainer, !communityId);
        }
    } catch (error) {
        feedContainer.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Failed to load feed.</div>`;
    }
}