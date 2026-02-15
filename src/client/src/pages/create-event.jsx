import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function getCommunityIdFromReferrer() {
    try {
        const referrer = document.referrer;
        if (!referrer) return null;

        const refUrl = new URL(referrer);
        if (refUrl.origin !== window.location.origin) return null;

        const parts = refUrl.pathname.split('/');
        if (parts[1] === 'community' && parts[2]) {
            return parts[2];
        }
    } catch {
        return null;
    }

    return null;
}

export default function CreateEventEntryPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const communityId = getCommunityIdFromReferrer();
        if (communityId) {
            navigate(`/community/${communityId}/events?createEvent=1`, { replace: true });
            return;
        }
        navigate('/', { replace: true });
    }, [navigate]);

    return null;
}
