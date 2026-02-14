export default function Error404({error="unknown"}) {
    return <>
        <h1>Page Not Found</h1>
        <span>The page you are looking for doesn't exist</span>
        <p>Error: {error}</p>
    </>;

}
