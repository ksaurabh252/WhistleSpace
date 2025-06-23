# 📡 WhistleSpace – Server (Backend)

This is the backend API for [WhistleSpace](https://github.com/your-org/whistlespace), an anonymous feedback platform built with **Node.js**, **Express**, and **MongoDB**, enhanced with **OpenAI AI-powered classification**, **moderation tools**, **comment threads**, and **email alerts**.

---

## 🚀 Features

- ✅ Submit anonymous feedback
- ✅ Search, pagination, and filtering (sentiment, category, date, status)
- ✅ AI tagging (category & sentiment using OpenAI)
- ✅ Admin moderation (approve / reject / delete)
- ✅ Export feedback to CSV
- ✅ Threaded comments
- ✅ Email alert on critical category (e.g. “Harassment” via Gmail)
- ✅ JWT token-based admin routes (secure)
- ✅ Nodemailer integration
- ✅ Scalable route & middleware setup

---

## 🧠 AI Integration

- **Category auto-tagging** using OpenAI:
  - `"Harassment"`, `"Suggestion"`, `"Technical Issue"`, `"Praise"`, `"Other"`
- **Sentiment detection**: `"Positive"`, `"Negative"`, `"Neutral"`

---

## 📁 Folder Structure

```
├── middleware/
│   └── auth.middleware.js
├── models/
│   ├── Admin.js
│   └── Feedback.js
├── routes/
│   ├── admin.routes.js
│   └── feedback.js
├── scripts/
│   └── seedAdmin.js
├── utils/
│   └── ai.js
├── .env
├── package.json
├── README.md
├── server.js
```

---

## ⚙️ Environment Variables

`.env` file in `/server` should contain:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/whistlespace
OPENAI_API_KEY=your_openai_key_here

ADMIN_EMAIL=your-alert-email@gmail.com
ADMIN_EMAIL_PASS=your-app-password
JWT_SECRET=some_long_random_string
```

## Running the Server

bash
cd server
npm install
npm start
