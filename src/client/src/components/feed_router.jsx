import React from "react";
import HomeFeed from "./home_feed.jsx";
import CommunityFeed from "./community_feed.jsx";
import UserFeed from "./user_feed.jsx";

export default function FeedRouter() {
    const path = window.location.pathname;

    if (path.startsWith("/community/")) {
        return <CommunityFeed />;
    }
    else if (path.startsWith("/user/")) {
        return <UserFeed />;
    }
    else {
        return <HomeFeed />;
    }
}