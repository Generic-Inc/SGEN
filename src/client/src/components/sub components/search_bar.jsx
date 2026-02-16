import {useEffect, useRef, useState} from "react";
import {fetchData, postData} from "../../static/api.js";

function normalizeHref(href) {
    if (!href) {
        return "/";
    }
    return href.startsWith("/") ? href : `/${href}`;
}

function normalizeResults(payload) {
    const raw = payload?.results ?? payload?.option ?? [];
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .filter((item) => item && typeof item.name === "string" && typeof item.href === "string")
        .map((item) => ({name: item.name, href: normalizeHref(item.href)}));
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const payload = await postData("search", {content: trimmedQuery});
                setResults(normalizeResults(payload));
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    const loadDefaultOptions = async () => {
        if (results.length > 0 || query.trim()) {
            return;
        }
        try {
            const payload = await fetchData("search");
            setResults(normalizeResults(payload));
        } catch {
            setResults([]);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (results.length > 0) {
            window.location.href = results[0].href;
        }
    };

    return (
        <div className="nav-search-wrapper" ref={containerRef}>
            <form className="nav-search" role="search" onSubmit={handleSubmit}>
                <span className="material-symbols-outlined nav-search-icon" aria-hidden="true">search</span>
                <input
                    type="search"
                    className="nav-search-input"
                    placeholder="Search communities or events"
                    value={query}
                    onFocus={async () => {
                        setIsOpen(true);
                        await loadDefaultOptions();
                    }}
                    onChange={(event) => {
                        setIsOpen(true);
                        setQuery(event.target.value);
                    }}
                    aria-label="Search communities or events"
                />
            </form>

            {isOpen && (
                <ul className="nav-search-results">
                    {isLoading && <li className="nav-search-result-item nav-search-status">Searching...</li>}
                    {!isLoading && results.length === 0 && query.trim() && (
                        <li className="nav-search-result-item nav-search-status">No results found</li>
                    )}
                    {!isLoading &&
                        results.map((result) => (
                            <li key={`${result.name}-${result.href}`} className="nav-search-result-item">
                                <a href={result.href}>{result.name}</a>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
}
