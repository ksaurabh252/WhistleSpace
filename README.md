```markdown
# 🚀 WhistleSpace

**WhistleSpace** is a modern, secure, and anonymous feedback platform for schools, startups, and organizations. It empowers users to submit feedback and concerns without revealing their identity, while providing admins with a powerful dashboard for moderation and response.

---

## 🏗️ Project Structure
```

whistlespace/
├── backend/ # Node.js, Express, MongoDB API
├── frontend/ # React, Chakra UI client
└── README.md # (this file)

````

---

## ✨ Features

- **Anonymous Feedback Submission**
- **Tagging & Categorization**
- **Comment Threads**
- **Admin Dashboard with Secure Login**
- **Email Notifications for Admins**
- **AI Moderation (Optional)**
- **Responsive, Modern UI**
- **JWT Access & Refresh Token Authentication**

---

## 🛠️ Tech Stack

- **Frontend:** React, Chakra UI, Axios, React Router, Vite
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer, OpenAI API (optional)

---

## 🚀 Getting Started

### 1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/whistlespace.git
cd whistlespace
````

---

### 2. **Setup the Backend**

```bash
cd backend
npm install
```

- Create a `.env` file in `/backend` with the following (edit as needed):

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

  OPENAI_API_KEY=sk-...
  ```

- Start the backend server:

  ```bash
  npm start
  ```

  The backend will run on [http://localhost:5000](http://localhost:5000).

---

### 3. **Setup the Frontend**

```bash
cd ../frontend
npm install
```

- Create a `.env` file in `/frontend` with:

  ```
  VITE_API_URL=http://localhost:5000
  ```

- Start the frontend app:

  ```bash
  npm run dev
  ```

  The frontend will run on [http://localhost:5173](http://localhost:5173).

---

## 🖥️ Usage

- **Feedback Board:**  
  Visit `/` to submit and view feedback anonymously.

- **Admin Login:**  
  Visit `/admin/login` to log in as admin.  
  After login, access the dashboard at `/admin/dashboard`.

- **Feedback Details:**  
  Click "View Details" on any feedback to see comments and add your own.

---

## 📁 Subproject READMEs

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

[MIT](LICENSE)

---

## 🙏 Acknowledgements

- [React](https://react.dev/)
- [Chakra UI](https://chakra-ui.com/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Nodemailer](https://nodemailer.com/)
- [OpenAI](https://openai.com/)

---

**Made with ❤️ for open feedback and better communication.**

```

```
