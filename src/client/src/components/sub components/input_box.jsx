export default function InputBox({
                                     iconName,
                                     inputType,
                                     placeholder,
                                     required = true,
                                     id,
                                     name,
                                 }) {
    const autoName =
        name ??
        `input-${iconName}-${inputType}-${String(placeholder)
            .replace(/\s+/g, "-")
            .toLowerCase()}-${required}`;

    const autoId = id ?? autoName;

    const autoPlaceholder = required ? `${placeholder} *` : `${placeholder} (optional)`;

    return (
        <div className="input-box">
            <span className="material-symbols-outlined">{iconName}</span>
            <input
                type={inputType}
                required={required}
                placeholder={autoPlaceholder}
                id={autoId}
                name={autoName}
            />
        </div>
    );
}
