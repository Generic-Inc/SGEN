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
