import { useEffect, useRef, useState } from "react";
import { postData } from "../static/api.js";

function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    async function sendMessage() {
        const content = input.trim();
        if (!content || isSending) {
            return;
        }

        const nextMessages = [...messages, { role: "user", content }];
        setMessages(nextMessages);
        setInput("");
        setError("");
        setIsSending(true);

        try {
            const response = await postData("chatbot", { message_history: nextMessages });
            if (response && Array.isArray(response.messages)) {
                setMessages(response.messages);
            } else {
                setError("Unexpected response from chatbot.");
            }
        } catch (err) {
            setError(err?.message || "Failed to send message.");
        } finally {
            setIsSending(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    }

    return (
        <>
            <button
                className="chatbot-fab"
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-controls="chatbot-window"
            >
                {isOpen ? "Close" : "Chat"}
            </button>
            {isOpen && (
                <div className="chatbot-window" id="chatbot-window" role="dialog" aria-label="Chatbot">
                    <div className="chatbot-header">
                        <span className="chatbot-title">Assistant</span>
                        <button
                            className="chatbot-close"
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            x
                        </button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div className="chatbot-empty">Start a conversation...</div>
                        )}
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`chatbot-message ${message.role}`}
                            >
                                {message.content}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                    {error && <div className="chatbot-error">{error}</div>}
                    <div className="chatbot-input-row">
                        <input
                            className="chatbot-input"
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSending}
                        />
                        <button
                            className="chatbot-send"
                            type="button"
                            onClick={sendMessage}
                            disabled={isSending || !input.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatbotWidget;

