export function readPageDetails() {
    const pageDetails = JSON.parse(localStorage.getItem('pageDetails'));
    if (!pageDetails) {return [];}
    return pageDetails;
}

export function openAsideBar() {
    const details = readPageDetails();
    for (const i of details) {
        const element = document.getElementById(i);
        if (element) {
            element.classList.add("open");
        }
    }
}

export function writeAsideBar(toggleID) {
    try {
        let page = readPageDetails();
        if (!page) {
            page = [];
            localStorage.setItem("pageDetails", JSON.stringify(page));
        }
        if (!page.includes(toggleID)) {
            page.push(toggleID);
        } else {
            page = page.filter(item => item !== toggleID);
        }
        localStorage.setItem("pageDetails", JSON.stringify(page));
    } catch {
        const pageDetails = [];
        localStorage.setItem("pageDetails", JSON.stringify(pageDetails));
    }

}

export function addListeners(ids) {
    const cleanups = [];

    ids.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;

        const header = element.querySelector("h3");
        if (!header) return;

        const handler = () => {
            const nextOpen = !element.classList.contains("open");
            element.classList.toggle("open", nextOpen);
            writeAsideBar(id, nextOpen);
        };

        header.addEventListener("click", handler);
        cleanups.push(() => header.removeEventListener("click", handler));
    });

    return () => cleanups.forEach((fn) => fn());
}

export function isInCommunity() {
    const path = window.location.pathname;
    const communityPattern = /^\/community\/[^\/]+(\/.*)?$/;
    return communityPattern.test(path);
}