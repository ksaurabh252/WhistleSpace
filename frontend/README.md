# 🚀 WhistleSpace Frontend

WhistleSpace is a modern, anonymous feedback platform for schools, startups, and organizations. This is the **frontend** built with React and Chakra UI, providing a clean, responsive, and user-friendly interface for both users and admins.

---

## ✨ Features

- **Anonymous Feedback Submission:** Anyone can submit feedback without logging in.
- **Tagging & Categorization:** Feedback can be tagged (e.g., bug, feature, UI, etc.).
- **Comment Threads:** Users and admins can comment on feedback (optionally anonymous).
- **Admin Dashboard:** Secure login for admins to view, filter, resolve, and moderate feedback.
- **Email Notifications:** Admins receive notifications for new feedback (when backend is configured).
- **AI Moderation:** (Optional) Feedback is checked for inappropriate content.
- **Responsive Design:** Works beautifully on desktop and mobile.

---

## 🛠️ Tech Stack

- **React 19**
- **Chakra UI** (for styling and components)
- **Axios** (for API requests)
- **React Router** (for routing)
- **Vite** (for fast development)
- **Context API** (for admin authentication)

---

## 🚀 Getting Started

### 1. **Clone the repository**

```bash
git clone https://github.com/yourusername/whistlespace-frontend.git
cd whistlespace-frontend
```

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Configure environment variables**

Create a `.env` file in the root directory and add:

```
VITE_API_URL=http://localhost:5000
```

> Make sure this URL matches your backend server address.

### 4. **Start the app**

```bash
npm run dev
```

The app will run on [http://localhost:5173](http://localhost:5173) by default.

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

## 📁 Project Structure

```
src/
  api/           # API request functions
  components/    # Reusable UI components
  context/       # Context providers (e.g., admin auth)
  pages/         # Page components (routes)
  utils/         # Utility functions
  App.jsx        # Main app component
  main.jsx       # Entry point
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

[MIT](LICENSE)

---

## 🙏 Acknowledgements

- [Chakra UI](https://chakra-ui.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)

---

**Made with ❤️ for open feedback and better communication.**
