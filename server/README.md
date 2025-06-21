# 📡 WhistleSpace – Server (Backend)

This is the backend API server for [WhistleSpace](https://github.com/your-org/whistlespace), an anonymous feedback platform built with Node.js, Express, and MongoDB. It receives and stores feedback entries and supports search, pagination, and (optionally) AI-powered tagging.

---

## 🚀 Features

- Submit anonymous feedback via REST API
- MongoDB-backed storage using Mongoose
- Search + Pagination support on admin fetch
- Scalable Express router structure
- CORS enabled for frontend integration
- Ready for future JWT authentication
- Configurable via `.env`

---

## 🔧 Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- dotenv for environment variables
- CORS & JSON body parsing

---

## 📁 Folder Structure

server/
├── models/
│ ├── Feedback.js # Feedback schema
│ └── Admin.js # Admin schema (optional for future login)
├── routes/
│ └── feedback.js # Feedback API routes
├── middleware/
│ └── auth.js # (Optional) Auth middleware
├── .env # Environment variables
├── server.js # App entry point
└── package.json

---

## ⚙️ Environment Variables

Create a `.env` file in `/server` with the following:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/whistlespace
OPENAI_API_KEY=your_openai_key_here

Running the Server
bash
cd server
npm install
npm start
```
