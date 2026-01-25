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

function likePost(element, postId, communityId) {
        element.classList.toggle("liked");
        fetch(`${window.location.origin}/api/community/${communityId}/posts/${postId}/likes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            const likeCountElement = document.getElementById(`${postId}-likes`);
            if (likeCountElement) {
                likeCountElement.innerText = `${data.likeCount} Likes`;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            element.classList.toggle('liked');
        });
    }