import {useEffect, useState} from "react";
import {checkStatus} from "../../static/api.js";

export default function TranslatedText({content, translations = null}) {
    const [user, setUser] = useState(null);
    const [showOriginal, setShowOriginal] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const status = await checkStatus();
            setUser(status.user);
        };
        fetchUser();
    }, []);

    const handleToggle = () => {
        setShowOriginal(!showOriginal);
    };

    if (!translations || !user) {
        return <span>{content}</span>;
    }

    const preferredLanguage = user.language;
    const translatedText = translations[preferredLanguage];

    const textToShow = showOriginal || !translatedText ? content : translatedText;

    return (
        <span>
            {textToShow}
            {translatedText && (
                <button onClick={handleToggle} style={{marginLeft: '8px', cursor: 'pointer'}}>
                    ({showOriginal ? 'show translation' : 'show original'})
                </button>
            )}
        </span>
    );
}