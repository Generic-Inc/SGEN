import { useState } from "react";
import { GEN_Z_SLANG } from "../../static/slang_dict";
import "../../static/styles/slang.css";

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

export default function SlangHighlighter({ text, userAge }) {
    if (!text) return null;

    // --- CHECK AGE HERE ---
    // If age is missing, or user is 60 or younger, render plain text.
    if (!userAge || userAge <= 60) {
        return <>{text}</>;
    }

    // Otherwise, render the highlighter
    const slangKeys = Object.keys(GEN_Z_SLANG);
    const regex = new RegExp(`\\b(${slangKeys.join("|")})\\b`, "gi");
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                const lowerPart = part.toLowerCase();
                if (GEN_Z_SLANG[lowerPart]) {
                    return (
                        <SlangWord
                            key={index}
                            word={part}
                            meaning={GEN_Z_SLANG[lowerPart]}
                        />
                    );
                }
                return part;
            })}
        </span>
    );
}