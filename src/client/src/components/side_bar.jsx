import {useEffect, useState} from "react";
import {fetchData} from "../static/api.js";
import {addListeners, isInCommunity, openAsideBar} from "../static/aside-bar.js";
import Error404 from "../pages/404.jsx";

export default function SideBar() {
    const [community, setCommunity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const path = window.location.pathname;
    const isInCommunityState = isInCommunity()
    useEffect(() => {

        openAsideBar(String(path));
        const ids = ["your-communities", "communities-test"];

        const cleanup = addListeners(ids, window.location.pathname);

        return cleanup;
    }, [path, isLoading]);

    useEffect(() => {
        if (!isInCommunityState) return;
        const communityId = path.split("/")[2];
        if (!communityId) return;


        const communityData = async () => {
            const communityId = path.split("/")[2]
            try {
                const data = await fetchData(`community/${communityId}`);
                setCommunity(data);
            } catch (error) {
                const errorMessage = `Community with ID ${communityId} not found`;
                return <Error404 error={errorMessage} />
                console.error("Error fetching community data:", error);
            }
            setIsLoading(false);
        }
        communityData()
    }, [path, isInCommunityState])
    if (!isInCommunityState || isLoading) {
        return (
            <div className="side-bar">
                <nav>
                    <ul className="aside-container">
                        <AsideItem symbol="home" text="Home" />
                        <li className="aside-category open" id="your-communities">
                            <h3 className="side-bar-title category-title">Your Communities</h3>
                            <CommunityList />
                        </li>
                        <li className="aside-category open" id="communities-test">
                            <h3 className="side-bar-title category-title">Recommended Communities</h3>
                            <CommunityList apiPath={"user/communities/recommendations"}/>
                        </li>
                    </ul>
                </nav>
            </div>
        );
    } else {
        console.log(community)
        return (
            <div className="side-bar">
                <nav>
                    <ul className="aside-container">
                        <AsideItem symbol="home" text="Home" href="/"
                                   material_style={{ fontSize: "1.6rem"}}
                        />
                        <AsideItem symbol="link_2" text={`${community.displayName} Homepage`}
                                   href={`/community/${community.communityId}`}
                                   material_style={{ fontSize: "1.5rem" }}
                        />
                        <AsideItem symbol="chat" text={`${community.displayName} Chat`}
                                   href={`/community/${community.communityId}/chat`}
                                   material_style={{ fontSize: "1.4rem" }}
                        />
                        <AsideItem symbol="calendar_today" text={`${community.displayName} Events`}
                                   href={`/community/${community.communityId}/events`}
                                   material_style={{ fontSize: "1.5rem" }}
                        />
                        <AsideItem symbol="people" text={`${community.displayName} Members`}
                                   href={`/community/${community.communityId}/members`}
                                   material_style={{ fontSize: "1.5rem" }}
                        />
                        <li className="aside-category" id="your-communities">
                            <h3 className="side-bar-title category-title">Your Communities</h3>
                            <CommunityList />
                        </li>
                        <li className="aside-category" id="communities-test">
                            <h3 className="side-bar-title category-title">Recommended Communities</h3>
                            <CommunityList apiPath={"user/communities/recommendations"}/>
                        </li>
                    </ul>
                </nav>
            </div>
        );
    }

}

function CommunityList({apiPath = "user/communities"}) {
    const [communities, setCommunities] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDataThing = async () => {
            try {
                setCommunities(await fetchData(apiPath));
            } catch (error) {
                console.error("Error fetching communities:", error);
                return <Error404 error="Community not found" />
            } finally {
                setLoading(false);
            }
        }
        fetchDataThing()
    }, [])

    if (loading){return <p>Loading...</p>}

    return (
        <>
            <ul className="side-bar-community-list page-container">
                {communities.communities.map((community) => (
                    <CommunityItem community={community} key={community.communityId}/>)
                )}
                </ul>
        </>
    )
}

function CommunityItem({community}) {
    return (
        <>
            <li>
                <a href={`/community/${community.communityId}`}>
                    <div className="side-bar-item">
                        <img src={community.iconUrl} alt="Community Icon" className="side-bar-community-icon"/>
                        <div className="side-bar-community-text">
                            <h4 className="side-bar-community-title">{community.displayName}</h4>
                            <span className="side-bar-community-subtitle">{community.communityName}</span>
                        </div>

                    </div>
                </a>
            </li>
        </>
    )
}

function AsideItem({symbol, text, href, material_style=null}) {
    return (
        <li className="side-bar-item">
            <a href={href}>
                <span className="material-symbols-outlined" style={material_style}>{symbol}</span>
                <span className="text">{text}</span>
            </a>

        </li>
    )
}