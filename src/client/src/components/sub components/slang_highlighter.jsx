import { useState } from "react";
import { GEN_Z_SLANG } from "../../static/slang_dict";
import "../../static/styles/slang.css";

const TRUSTED_DOMAINS = [
    "google.com", "www.google.com",
    "youtube.com", "www.youtube.com",
    "facebook.com", "www.facebook.com",
    "instagram.com", "www.instagram.com",
    "wikipedia.org", "en.wikipedia.org"
];

function SlangWord({ word, meaning }) {
    const [isClicked, setIsClicked] = useState(false);

    return (
        <span
            className={`slang-term ${isClicked ? "clicked" : ""}`}
            data-meaning={meaning}
            onClick={(e) => {
                e.stopPropagation();
                setIsClicked(!isClicked);
            }}
        >
            {word}
        </span>
    );
}

function LinkWithGuard({ url }) {
    const [showWarning, setShowWarning] = useState(false);

    const href = url.startsWith("http") ? url : `https://${url}`;
    const isTrusted = TRUSTED_DOMAINS.some(domain => url.toLowerCase().includes(domain));

    const handleLinkClick = (e) => {
        if (isTrusted) return;
        e.preventDefault();
        e.stopPropagation();
        setShowWarning(true);
    };

    const handleProceed = () => {
        setShowWarning(false);
        window.open(href, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            <a
                href={href}
                onClick={handleLinkClick}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1877F2", textDecoration: "underline", cursor: "pointer", fontWeight: "600" }}
            >
                {url}
            </a>

            {showWarning && (
                <div className="safety-modal-overlay" onClick={() => setShowWarning(false)}>
                    <div className="safety-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>🛡️ Leaving S-Gen?</h3>
                        <p>
                            You are about to leave our safe app and go to an external website.
                            <strong>Do you trust this link?</strong>
                        </p>
                        <div className="link-preview">{url}</div>
                        <div className="safety-actions">
                            <button className="safety-btn cancel" onClick={() => setShowWarning(false)}>
                                Go Back
                            </button>
                            <button className="safety-btn proceed" onClick={handleProceed}>
                                Yes, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function SlangHighlighter({ text, userAge }) {
    if (!text) return null;

    // Safety check: If age is missing or young, return plain text
    if (!userAge || userAge <= 60) {
        return <>{text}</>;
    }

    const slangKeys = Object.keys(GEN_Z_SLANG);
    if (slangKeys.length === 0) return <>{text}</>;

    // 1. Sort by length (Longest first)
    slangKeys.sort((a, b) => b.length - a.length);

    // 2. Regex Pattern
    const urlPattern = "(?:https?:\\/\\/|www\\.)[^\\s]+";
    const slangPattern = `\\b(?:${slangKeys.join("|")})\\b`;

    // 3. One Capture Group
    const regex = new RegExp(`(${urlPattern}|${slangPattern})`, "gi");

    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                if (!part) return null;

                const lowerPart = part.toLowerCase();

                // 1. Is it a URL?
                if (lowerPart.startsWith("http") || lowerPart.startsWith("www.")) {
                    return <LinkWithGuard key={index} url={part} />;
                }

                // 2. Is it Slang?
                if (GEN_Z_SLANG[lowerPart]) {
                    return (
                        <SlangWord
                            key={index}
                            word={part}
                            meaning={GEN_Z_SLANG[lowerPart]}
                        />
                    );
                }

                // 3. Plain Text
                return part;
            })}
        </span>
    );
}