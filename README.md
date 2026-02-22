<img src="assets/image(1).png" width=200 alt="logo">

# SGEN
A webapp designed to connect Singaporean Youths and Elderly together from common interests

## Core Features:
### Secure Registration and Sign-in (Authentications)
User passwords are securely stored with a hash and salt in our database

Cookies are sent to the client and hashed in the backend to ensure secure authentication.
Cookies are also HttpOnly to prevent access from client-side scripts, enhancing security against XSS attacks.

### Communities
Users can create and join communities based on shared interests, fostering connections between Singaporean youths and the elderly.

Members are given permissions based on their role like banned, member, admin, and owner

### Real-Time Chat System (WebSockets)
SGEN features a live chat system powered by WebSockets to connect users instantly.

- Instant Messaging: Messages are sent and received in real-time, letting users talk back and forth without ever needing to refresh the page.
- Live Updates: If a user edits or deletes a message, those changes update immediately on everyone else's screen.
- Private Chat Rooms: Conversations are kept secure and organized by automatically grouping users into specific chat rooms based on the community they join.

## Extra Features:
- Chatbot Assistant
- Searchbar
- Onboarding AI recommendations
- User customizability
- Real-time Unique Online Counter
- Image url and emoji in message

## .env file structure
```
GROQ_API_KEY=xxx
SMTP_SERVER=xxx
SMTP_PORT=xxx
SENDER_EMAIL=xxx
GOOGLE_PROJECT_ID=xxx
```
