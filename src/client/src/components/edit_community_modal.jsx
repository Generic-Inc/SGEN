import { useEffect, useState } from "react";
import { fetchData } from "../static/api";
import "../static/styles/community.css";

function getCommunityIdFromPath() {
    const parts = window.location.pathname.split("/");
    const idx = parts.indexOf("community");
    if (idx === -1) return null;
    return parts[idx + 1] || null;
}

// Modal for editing community information via PATCH /api/community/:communityId
// Sends ONLY changed fields (plus communityId in the URL).
export default function EditCommunityModal() {
    const [isOpen, setIsOpen] = useState(false);

    const [communityId, setCommunityId] = useState(() => getCommunityIdFromPath());

    // Original values (so we can send only changed fields)
    const [original, setOriginal] = useState(null);

    // Editable fields
    const [displayName, setDisplayName] = useState("");
    const [description, setDescription] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [postsGuidelines, setPostsGuidelines] = useState("");
    const [messagesGuidelines, setMessagesGuidelines] = useState("");
    const [offlineText, setOfflineText] = useState("");
    const [onlineText, setOnlineText] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Listen for link clicks like /edit/community and a custom event "openEditCommunityModal".
    useEffect(() => {
        const handleLinkClick = (e) => {
            const anchor = e.target.closest("a");
            if (anchor && anchor.getAttribute("href") === "/edit/community") {
                e.preventDefault();

                // Re-read communityId at open time (pathname changes won't re-render this component).
                const id = getCommunityIdFromPath();
                setCommunityId(id);

                if (id) setIsOpen(true);
            }
        };

        const handleOpenEvent = () => {
            const id = getCommunityIdFromPath();
            setCommunityId(id);
            if (id) setIsOpen(true);
        };

        document.addEventListener("click", handleLinkClick);
        window.addEventListener("openEditCommunityModal", handleOpenEvent);

        return () => {
            document.removeEventListener("click", handleLinkClick);
            window.removeEventListener("openEditCommunityModal", handleOpenEvent);
        };
    }, []);

    // When opening, load current community values to edit.
    useEffect(() => {
        if (!isOpen) return;
        if (!communityId) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            setSuccess(null);
            try {
                const data = await fetchData(`community/${communityId}`);
                const normalized = {
                    displayName: data?.displayName ?? data?.display_name ?? "",
                    description: data?.description ?? "",
                    iconUrl: data?.iconUrl ?? data?.icon_url ?? "",
                    postsGuidelines: data?.postsGuidelines ?? data?.postGuidelines ?? data?.post_guidelines ?? "",
                    messagesGuidelines: data?.messagesGuidelines ?? data?.messages_guidelines ?? "",
                    offlineText: data?.offlineText ?? data?.offline_text ?? "",
                    onlineText: data?.onlineText ?? data?.online_text ?? "",
                };

                setOriginal(normalized);
                setDisplayName(normalized.displayName);
                setDescription(normalized.description);
                setIconUrl(normalized.iconUrl);
                setPostsGuidelines(normalized.postsGuidelines);
                setMessagesGuidelines(normalized.messagesGuidelines);
                setOfflineText(normalized.offlineText);
                setOnlineText(normalized.onlineText);
            } catch {
                setError("Could not load community info.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [isOpen, communityId]);

    const onClose = () => {
        setIsOpen(false);
        setLoading(false);
        setError(null);
        setSuccess(null);
    };

    const buildPatchPayload = () => {
        if (!original) return null;

        const candidate = {
            displayName: displayName,
            description: description,
            iconUrl: iconUrl,
            postsGuidelines: postsGuidelines,
            messagesGuidelines: messagesGuidelines,
            offlineText: offlineText,
            onlineText: onlineText,
        };

        // Only include fields that actually changed
        const patch = {};
        for (const [key, value] of Object.entries(candidate)) {
            const normalizedValue = (value ?? "");
            if (normalizedValue !== (original[key] ?? "")) {
                patch[key] = normalizedValue;
            }
        }

        return patch;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!communityId) {
            setError("Community ID not found.");
            return;
        }

        const patch = buildPatchPayload();
        if (!patch) {
            setError("Nothing to update.");
            return;
        }

        if (Object.keys(patch).length === 0) {
            setSuccess("No changes to save.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/community/${communityId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(patch),
            });

            if (!response.ok) {
                let message = `${response.status} ${response.statusText}`;
                try {
                    const payload = await response.json();
                    message = payload?.error || payload?.message || message;
                } catch {
                    // ignore
                }

                setError(message);
                return;
            }

            setSuccess("Saved changes.");
            // Refresh current page data
            setTimeout(() => window.location.reload(), 350);
        } catch (err) {
            setError(err?.message || "Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay edit-community-modal-overlay">
            <div className="modal-content edit-community-modal-content">
                <button onClick={onClose} aria-label="Close" className="edit-community-close">
                    &times;
                </button>

                <h2 className="edit-community-title">Edit Community</h2>

                {!communityId && (
                    <div className="edit-community-error">Community ID not found for this page.</div>
                )}

                {error && <div className="edit-community-error">{error}</div>}
                {success && <div className="edit-community-success">{success}</div>}

                {loading && <div className="edit-community-loading">Loading…</div>}

                {!loading && communityId && (
                    <form onSubmit={handleSubmit}>
                        <div className="edit-community-form">
                            <div>
                                <label className="edit-community-label">Display name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="edit-community-input"
                                />
                            </div>

                            <div>
                                <label className="edit-community-label">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="edit-community-textarea"
                                />
                            </div>

                            <div>
                                <label className="edit-community-label">Icon URL</label>
                                <input
                                    type="text"
                                    value={iconUrl}
                                    onChange={(e) => setIconUrl(e.target.value)}
                                    className="edit-community-input"
                                />
                            </div>

                            <div>
                                <label className="edit-community-label">Posts guidelines</label>
                                <textarea
                                    value={postsGuidelines}
                                    onChange={(e) => setPostsGuidelines(e.target.value)}
                                    className="edit-community-textarea"
                                />
                            </div>

                            <div>
                                <label className="edit-community-label">Messages guidelines</label>
                                <textarea
                                    value={messagesGuidelines}
                                    onChange={(e) => setMessagesGuidelines(e.target.value)}
                                    className="edit-community-textarea"
                                />
                            </div>

                            <div className="edit-community-two-col">
                                <div>
                                    <label className="edit-community-label">Offline text</label>
                                    <input
                                        type="text"
                                        value={offlineText}
                                        onChange={(e) => setOfflineText(e.target.value)}
                                        className="edit-community-input"
                                    />
                                </div>

                                <div>
                                    <label className="edit-community-label">Online text</label>
                                    <input
                                        type="text"
                                        value={onlineText}
                                        onChange={(e) => setOnlineText(e.target.value)}
                                        className="edit-community-input"
                                    />
                                </div>
                            </div>

                            <div className="edit-community-actions">
                                <button type="button" onClick={onClose} className="edit-community-cancel">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="edit-community-submit">
                                    {loading ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
