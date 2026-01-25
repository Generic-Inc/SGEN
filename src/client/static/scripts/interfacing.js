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