const root_url = "https://sgen-production.up.railway.app";

async function parseResponseBody(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    try {
        const text = await response.text();
        return text || null;
    } catch {
        return null;
    }
}


export async function fetchData(route) {
    const response = await fetch(`${root_url}/api/${route}`, {
        credentials: "include",
        method: "GET"
    });

    if (!response.ok) {
        throw new Error(
            `Error fetching data from /api/${route}: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}

export async function postData(route, data) {
    const response = await fetch(`${root_url}/api/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        credentials: "include"
    });
    const payload = await parseResponseBody(response);
    if (!response.ok) {
        const message =
            (payload && typeof payload === "object" && (payload.error || payload.message)) ||
            (typeof payload === "string" && payload) ||
            `${response.status} ${response.statusText}`;

        const err = new Error(message);
        err.status = response.status;
        err.payload = payload; // <- access this in catch
        throw err;
    }

    return payload;
}

export async function deleteData(route, data = null) {
    const response = await fetch(`${root_url}/api/${route}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: data === null ? null : JSON.stringify(data),
        credentials: "include"
    });

    const payload = await parseResponseBody(response);
    if (!response.ok) {
        const message =
            (payload && typeof payload === "object" && (payload.error || payload.message)) ||
            (typeof payload === "string" && payload) ||
            `${response.status} ${response.statusText}`;

        const err = new Error(message);
        err.status = response.status;
        err.payload = payload;
        throw err;
    }

    return payload;
}

export async function checkStatus() {
    const response = await fetch(`${root_url}/api/auth/check-status`, {
        credentials: "include",
            method: "GET"
    }
);

    const parsed = await parseResponseBody(response);

    if (!response.ok) {
        const message =
            (parsed && typeof parsed === "object" && (parsed.error || parsed.message)) ||
            (typeof parsed === "string" && parsed) ||
            `${response.status} ${response.statusText}`;
        throw new Error(message);
    }

    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid response from /api/auth/check-status");
    }

    const currentPath = window.location.pathname;
    const isLoginRoute = currentPath === "/login";
    const isOnboardingRoute = currentPath === "/onboarding";

    if (!parsed.authenticated && !isLoginRoute) {
        window.location.href = "/login";
    }
    if (!parsed.onboarding && !isOnboardingRoute) {
        window.location.href = "/onboarding";
    }

    return parsed;
}

export async function getUserCommunities() {
    return await fetchData("user/communities");
}

export function getCommunityIdFromPage() {
    const path = window.location.pathname;
    const split_path = path.split("/");
    if (split_path[1] !== "community") {
        return null
    }
    return split_path[2];
}