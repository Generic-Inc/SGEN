import { useState } from "react";
import { GEN_Z_SLANG } from "../../static/slang_dict";
import "../../static/styles/slang.css";

// 1. New Sub-Component to handle individual word clicks
function SlangWord({ word, meaning }) {
    const [isClicked, setIsClicked] = useState(false);

    return (
        <span
            className={`slang-term ${isClicked ? "clicked" : ""}`}
            data-meaning={meaning}
            onClick={(e) => {
                e.stopPropagation(); // Stop the click from bubbling up
                setIsClicked(!isClicked); // Toggle pinned state
            }}
        >
            {word}
        </span>
    );
}

// 2. Main Component
export default function SlangHighlighter({ text }) {
    if (!text) return null;

    const slangKeys = Object.keys(GEN_Z_SLANG);
    // Regex to match whole words only (so "bet" doesn't match "better")
    const regex = new RegExp(`\\b(${slangKeys.join("|")})\\b`, "gi");
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                const lowerPart = part.toLowerCase();
                if (GEN_Z_SLANG[lowerPart]) {
                    // Render the smart component for slang
                    return (
                        <SlangWord
                            key={index}
                            word={part}
                            meaning={GEN_Z_SLANG[lowerPart]}
                        />
                    );
                }
                // Render plain text for everything else
                return part;
            })}
        </span>
    );
}