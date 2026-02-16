import re
from typing import Any, Iterable, Mapping, MutableMapping, Optional

# Focused explicit-language list to reduce over-censoring.
EXPLICIT_TERMS = (
    "asshole",
    "bastard",
    "bitch",
    "bitches",
    "bullshit",
    "cunt",
    "dick",
    "fuck",
    "fucker",
    "fucking",
    "motherfucker",
    "pussy",
    "shit",
    "slut",
    "whore",
)

EXPLICIT_PATTERN = re.compile(
    r"(?<![A-Za-z0-9_])(" + "|".join(re.escape(word) for word in EXPLICIT_TERMS) + r")(?![A-Za-z0-9_])",
    re.IGNORECASE,
)


def censor_text(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text:
        return text
    return EXPLICIT_PATTERN.sub(lambda match: "*" * len(match.group(0)), text)


def censor_fields(payload: MutableMapping[str, Any], fields: Iterable[str]) -> MutableMapping[str, Any]:
    for field in fields:
        value = payload.get(field)
        if isinstance(value, str):
            payload[field] = censor_text(value)
    return payload


def build_post_content(payload: Mapping[str, Any]) -> Optional[str]:
    """
    Normalize post text from either:
    - content
    - title + description
    """
    content = payload.get("content")
    if isinstance(content, str) and content.strip():
        return content

    title = payload.get("title")
    description = payload.get("description")
    parts = [part.strip() for part in (title, description) if isinstance(part, str) and part.strip()]
    if not parts:
        return None
    return "\n\n".join(parts)
