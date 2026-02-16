import { useEffect, useMemo, useState } from "react";
import { postData } from "../static/api";
import "../static/styles/community.css";

// Modal for creating a community via POST /api/community
// Payload keys must match backend: communityName, displayName, description, iconUrl,
// postsGuidelines, messagesGuidelines, offlineText, onlineText
export default function CreateCommunity() {
    const [isOpen, setIsOpen] = useState(false);

    const [communityName, setCommunityName] = useState("");
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

    const suggestedCommunityName = useMemo(() => {
        // slug-ish helper: lowercase, spaces -> '-', strip non [a-z0-9-]
        return (displayName || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }, [displayName]);

    // Open modal when clicking the existing Create dropdown link: /create/community
    useEffect(() => {
        const handleLinkClick = (e) => {
            const anchor = e.target.closest("a");
            if (anchor && anchor.getAttribute("href") === "/create/community") {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        const handleOpenEvent = () => setIsOpen(true);

        document.addEventListener("click", handleLinkClick);
        window.addEventListener("openCommunityModal", handleOpenEvent);

        return () => {
            document.removeEventListener("click", handleLinkClick);
            window.removeEventListener("openCommunityModal", handleOpenEvent);
        };
    }, []);

    // If user hasn't typed a communityName, suggest one based on displayName
    useEffect(() => {
        if (!communityName && suggestedCommunityName) {
            setCommunityName(suggestedCommunityName);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suggestedCommunityName]);

    const onClose = () => {
        setIsOpen(false);
        setLoading(false);
        setError(null);
        setSuccess(null);
    };

    const validate = () => {
        if (!communityName.trim()) return "Community name is required.";
        if (!/^[a-z0-9-]+$/i.test(communityName.trim())) return "Community name may only contain letters, numbers, and dashes.";
        if (!displayName.trim()) return "Display name is required.";
        if (!description.trim()) return "Description is required.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        // Backend currently requires these KEYS to exist in the JSON payload.
        // We include them even if they're empty strings.
        const payloadToSend = {
            communityName: communityName.trim(),
            displayName: displayName.trim(),
            description: description.trim(),
            iconUrl: iconUrl.trim(),
            postsGuidelines: postsGuidelines.trim(),
            messagesGuidelines: messagesGuidelines.trim(),
            offlineText: offlineText.trim(),
            onlineText: onlineText.trim(),
        };

        try {
            setLoading(true);
            const payload = await postData("community", payloadToSend);

            setSuccess("Community created!");

            // Best-effort redirect to community page if backend returns an identifier
            const newId =
                payload?.communityId ||
                payload?.community_id ||
                payload?.communityName ||
                payload?.community_name;

            if (newId) {
                setTimeout(() => {
                    window.location.href = `/community/${newId}`;
                }, 400);
            } else {
                setLoading(false);
            }
        } catch (err) {
            setError(err?.message || "Failed to create community.");
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay create-community-modal-overlay">
            <div className="modal-content create-community-modal-content">
                <button onClick={onClose} aria-label="Close" className="create-community-close">
                    &times;
                </button>

                <h2 className="create-community-title">Create Community</h2>

                {error && <div className="create-community-error">{error}</div>}
                {success && <div className="create-community-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="create-community-form">
                        <div>
                            <label className="create-community-label">Display name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g., SG Foodies"
                                className="create-community-input"
                            />
                        </div>

                        <div>
                            <label className="create-community-label">Community name (URL)</label>
                            <input
                                type="text"
                                value={communityName}
                                onChange={(e) => setCommunityName(e.target.value)}
                                placeholder={suggestedCommunityName ? `Suggested: ${suggestedCommunityName}` : "e.g., sg-foodies"}
                                className="create-community-input"
                            />
                            <div className="create-community-help">
                                letters/numbers/dashes only. This becomes <code>/community/&lt;name&gt;</code>.
                            </div>
                        </div>

                        <div>
                            <label className="create-community-label">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this community about?"
                                className="create-community-textarea"
                            />
                        </div>

                        <div>
                            <label className="create-community-label">Icon URL</label>
                            <input
                                type="text"
                                value={iconUrl}
                                onChange={(e) => setIconUrl(e.target.value)}
                                placeholder="https://..."
                                className="create-community-input"
                                required={false}
                            />
                        </div>

                        <div>
                            <label className="create-community-label">Posts guidelines</label>
                            <textarea
                                value={postsGuidelines}
                                onChange={(e) => setPostsGuidelines(e.target.value)}
                                placeholder="Rules for posts"
                                className="create-community-textarea"
                                required={false}
                            />
                        </div>

                        <div>
                            <label className="create-community-label">Messages guidelines</label>
                            <textarea
                                value={messagesGuidelines}
                                onChange={(e) => setMessagesGuidelines(e.target.value)}
                                placeholder="Rules for chat/messages"
                                className="create-community-textarea"
                                required={false}
                            />
                        </div>

                        <div className="create-community-two-col">
                            <div>
                                <label className="create-community-label">Offline text</label>
                                <input
                                    type="text"
                                    value={offlineText}
                                    onChange={(e) => setOfflineText(e.target.value)}
                                    placeholder="e.g., Be right back"
                                    className="create-community-input"
                                    required={false}
                                />
                            </div>

                            <div>
                                <label className="create-community-label">Online text</label>
                                <input
                                    type="text"
                                    value={onlineText}
                                    onChange={(e) => setOnlineText(e.target.value)}
                                    placeholder="e.g., Online now"
                                    className="create-community-input"
                                    required={false}
                                />
                            </div>
                        </div>

                        <div className="create-community-actions">
                            <button type="button" onClick={onClose} className="create-community-cancel">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="create-community-submit">
                                {loading ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
