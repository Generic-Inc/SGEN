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


## Extra Features:
- Chatbot Assistant
- Searchbar
- Onboarding AI recommendations
- User customizability

## .env file structure
```
GROQ_API_KEY=xxx
SMTP_SERVER=xxx
SMTP_PORT=xxx
SENDER_EMAIL=xxx
GOOGLE_PROJECT_ID=xxx
```
