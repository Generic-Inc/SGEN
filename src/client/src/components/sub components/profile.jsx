export default function Profile({avatarUrl, hrefUrl=null, className=null}) {
    return <a href={hrefUrl}>
        <img src={avatarUrl} alt="Profile Avatar" className={className ? className : "profile-avatar"} />
    </a>
}
