async function fetchCommunities() {
    const response = await fetch(window.location.origin + "/api/user/communities", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    if (response.ok) {
        const data = await response.json();
        return data.communities || [];
    }
    return [];
}

async function generateMyCommunities() {
    const communities = await fetchCommunities();
    const container = document.getElementById("my-communities-list");
    for (const community of communities) {
        const communityElement = document.createElement("div");
        communityElement.classList.add("community-item");
        communityElement.innerHTML = `<span class="material-icons">groups</span>
<span>${community.displayName}</span>`
        container.appendChild(communityElement);
    }
}

generateMyCommunities();
console.log("test")
