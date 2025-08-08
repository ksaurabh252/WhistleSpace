# 🚀 WhistleSpace Backend

WhistleSpace is a modern, secure, and anonymous feedback platform for schools, startups, and organizations. This **backend** is built with Node.js, Express, and MongoDB, providing robust APIs, admin authentication, email notifications, and optional AI moderation.

---

## ✨ Features

- **Anonymous Feedback Submission:** Users can submit feedback without revealing their identity.
- **Tagging & Categorization:** Feedback can be tagged for easy filtering (e.g., bug, feature, UI, etc.).
- **Comment Threads:** Add and moderate comments on feedback.
- **Admin Authentication:** Secure JWT-based login with access and refresh tokens.
- **Admin Dashboard APIs:** Endpoints for viewing, filtering, resolving, and deleting feedback and comments.
- **Email Notifications:** Sends email to admin on new feedback (configurable).
- **AI Moderation:** (Optional) Uses OpenAI API to flag inappropriate feedback.
- **Rate Limiting & CORS:** Secure and production-ready.
- **Refresh Token System:** Secure session management with HTTP-only cookies.
- **Environment Variables:** All sensitive data and config are managed via `.env`.

---

## 🛠️ Tech Stack

- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **JWT** (access & refresh tokens)
- **Nodemailer** (for email notifications)
- **OpenAI API** (for moderation, optional)
- **dotenv**, **cookie-parser**, **express-rate-limit**

---

## 🚀 Getting Started

### 1. **Clone the repository**

```bash
git clone https://github.com/yourusername/whistlespace-backend.git
cd whistlespace-backend
```

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Configure Environment Variables**

Create a `.env` file in the root directory with the following content:

```
MONGO_URI=mongodb://localhost:27017/whistlespace
PORT=5000
FRONTEND_URL=http://localhost:5173

JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=yourStrongPassword
ADMIN_EMAIL=admin@example.com

OPENAI_API_KEY=sk-...   # (Optional, for AI moderation)
```

> **Note:**
>
> - Update the values with your own credentials and secrets.
> - `OPENAI_API_KEY` is optional (for AI moderation).

### 4. **Start the server**

```bash
npm start
```

The server will run at [http://localhost:5000](http://localhost:5000) by default.

---

## 🖥️ API Endpoints

- `POST /admin/init` — **(First time only)** Create an admin user
- `POST /admin/login` — Admin login (returns access token, sets refresh token cookie)
- `POST /admin/refresh` — Refresh access token using refresh token cookie
- `POST /admin/logout` — Logout and invalidate refresh token
- `POST /feedback` — Submit anonymous feedback
- `GET /feedback` — List all feedback (with optional filters)
- `GET /feedback/:id` — Get feedback details and comments
- `POST /feedback/:id/comment` — Add a comment
- `PATCH /feedback/:id` — Update feedback status (admin only)
- `DELETE /feedback/:id` — Delete feedback and its comments (admin only)
- `DELETE /feedback/:feedbackId/comment/:commentId` — Delete a comment (admin only)

---

## 📁 Project Structure

```
.
├── controllers/
├── middleware/
│   └── auth.js
├── models/
│   ├── Admin.model.js
│   ├── Comment.model.js
│   └── Feedback.model.js
├── routes/
│   ├── admin.routes.js
│   └── feedback.routes.js
├── utils/
│   ├── moderateFeedback.js
│   └── sendEmail.js
├── app.js
├── server.js
├── .env
└── package.json
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

[MIT](LICENSE)

---

## 🙏 Acknowledgements

- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Nodemailer](https://nodemailer.com/)
- [OpenAI](https://openai.com/)

---

**Made with ❤️ for open feedback and better communication.**
