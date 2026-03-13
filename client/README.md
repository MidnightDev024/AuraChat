# AuraChat 💬

A real-time chat application built with React, Node.js, and Socket.IO.

## Features

- 🔐 **Authentication** — JWT-based login & signup with push notification support
- 💬 **Real-time messaging** — Powered by Socket.IO for instant message delivery
- 🌙 **Light / Dark theme** — Toggle between dark and light modes, persisted across sessions
- ⚡ **Skeleton loaders** — Smooth loading states for the sidebar and message area
- 🖼️ **Media sharing** — Send images and files in conversations
- 😀 **Emoji & GIF picker** — Built-in emoji picker and GIPHY integration
- 🔔 **Push notifications** — Web push notifications for messages received while the app is inactive
- 🗑️ **Delete messages** — Delete for me or delete for everyone
- 👁️ **Online presence** — See which users are currently online
- 🔍 **User search** — Filter contacts in the sidebar by name
- 📱 **Responsive** — Works on desktop and mobile

## Major Differences vs [VibeChat](https://github.com/priyanshuwq/VibeChat)

| Feature | AuraChat | VibeChat |
|---|---|---|
| State management | React Context API | Zustand |
| Push notifications | ✅ Web Push API + Service Worker | ❌ |
| GIF support | ✅ GIPHY integration | ❌ |
| File sharing | ✅ | ❌ |
| Delete messages | ✅ Delete for me / for everyone | ❌ |
| Light/Dark theme | ✅ CSS custom properties | ✅ DaisyUI themes |
| Skeleton loaders | ✅ | ✅ |
| Framer Motion | ✅ (NoChatSelected, ThemeToggle) | ✅ (Navbar, broader usage) |
| UI library | Tailwind CSS v4 | Tailwind CSS v3 + DaisyUI |
| Auth method | JWT in localStorage + header | JWT in httpOnly cookies |
| Separate Signup page | ❌ combined Login/Signup | ✅ |
| Settings page | ❌ | ✅ |

## Tech Stack

**Frontend**
- React 19
- Tailwind CSS v4
- Socket.IO Client
- Framer Motion
- Zustand (theme store)
- Lucide React
- Emoji Picker React
- GIPHY React Components

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- Web Push (VAPID)

## Getting Started

```bash
# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install

# Start backend
cd server && npm run dev

# Start frontend (in a separate terminal)
cd client && npm run dev
```

Configure environment variables in `client/.env` and `server/.env` before starting.
