export function DropdownWrapper({ id, isOpen, children }) {
    return (
        <ul className={`dropdown-list ${isOpen ? "shown" : ""}`} id={id}>
            {children}
        </ul>
    );
}

export function DropdownElement({ icon, text, link }) {
    return(
        <li className="dropdown-list-element">
            <a href={link}>
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text">{text}</span>
            </a>
        </li>
    )
}
