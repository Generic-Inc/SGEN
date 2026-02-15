import { GEN_Z_SLANG } from "../../static/slang_dict";
import "../../static/styles/slang.css";

export default function SlangHighlighter({ text }) {
    if (!text) return null;

    // Create regex to match slang words (case insensitive)
    const slangKeys = Object.keys(GEN_Z_SLANG);
    // \b ensures we match "bet" but not "alphabet"
    const regex = new RegExp(`\\b(${slangKeys.join("|")})\\b`, "gi");

    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                const lowerPart = part.toLowerCase();
                if (GEN_Z_SLANG[lowerPart]) {
                    return (
                        <span key={index} className="slang-term" data-meaning={GEN_Z_SLANG[lowerPart]}>
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
}