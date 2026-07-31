# VaultShare — Digital Asset Sharing & Collaboration Platform

A full-stack MERN application for uploading, sharing, and downloading files between
friends, with a real-time 1:1 chat built on Socket.io.

## Features
- JWT authentication (register/login)
- Friend system: search users, send/accept/reject friend requests
- Upload files to AWS S3 via pre-signed URLs, share with friends, download & delete
- Real-time chat with Socket.io (online presence + typing indicator)
- Sidebar navigation, notification bell for friend requests, profile avatar menu

## Tech Stack
- **Frontend:** React (Vite) + TailwindCSS + React Router + Axios + Socket.io-client
- **Backend:** Node.js + Express + Mongoose
- **Database:** MongoDB (Atlas recommended)
- **File Storage:** AWS S3 (pre-signed PUT/GET)
- **Real-time:** Socket.io

## Project Structure
```
vaultshare/
  backend/
    config/        # db.js, s3.js
    models/        # User, Asset, Conversation, Message
    controllers/   # auth, friend, asset, message logic
    routes/        # Express routers
    middleware/    # auth (JWT)
    socket.js      # Socket.io server + event handlers
    server.js      # entry point
  frontend/
    src/
      context/     # AuthContext, SocketContext
      api/         # axios instance
      pages/       # Login, Register, Dashboard, Friends, Chat, Profile
      components/  # AppLayout, Sidebar, Navbar
```

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, AWS_* keys
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # points to backend URL
npm run dev
```

### 3. Get your keys
- **MongoDB Atlas:** create a free cluster, copy the connection string into `MONGO_URI`.
- **AWS S3:** create a bucket, IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, then set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`.
- **S3 CORS** (required for browser PUT uploads) — example bucket CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"]
  }
]
```
- **JWT_SECRET:** any long random string.

## API Overview
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Log in, get JWT |
| GET | /api/friends/search?q= | Search users |
| POST | /api/friends/request/:targetId | Send friend request |
| POST | /api/friends/respond/:requesterId | Accept/reject request |
| POST | /api/assets/presign | Get S3 pre-signed upload URL |
| POST | /api/assets/confirm | Save asset metadata after S3 upload |
| GET | /api/assets | Get owned + shared-with-me assets |
| POST | /api/assets/:assetId/share | Share asset with a friend |
| GET | /api/assets/:assetId/download | Get pre-signed download URL |
| DELETE | /api/assets/:assetId | Delete asset from S3 + DB |
| GET | /api/messages/conversations/:friendId/start | Get/create conversation |
| GET | /api/messages/:conversationId | Get message history |

Chat also runs over Socket.io events: `chat:join`, `chat:message`, `chat:typing`, `presence:update`.
