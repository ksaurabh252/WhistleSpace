# 🎯 WhistleSpace – Client (Frontend)

This is the **React + Chakra UI** frontend of **WhistleSpace**, an anonymous feedback platform for teams, campuses, and communities. Users can safely submit feedback, and admins can moderate, filter, and export them through a beautiful dashboard.

---

## 🚀 Features

- ✅ Anonymous feedback submission form
- ✅ Real-time character count & validation
- ✅ AI-powered category & sentiment tagging (handled via backend)
- ✅ Mobile-first responsive UI (bottom nav, drawer)
- ✅ Dark mode support with toggle
- ✅ Confetti animation on success
- ✅ Admin dashboard with:
  - Pagination
  - Search with keyword highlighting
  - Filters (category, sentiment, date range, status)
  - Moderation tools: Approve / Reject / Delete
  - CSV export
  - JWT-authenticated access
  - Loading skeletons & toasts
  - Comment threads for feedback (coming soon)
- ✅ Protected routes via React Context
- ✅ Axios interceptor for JWT auth

---

## 🧱 Tech Stack

- React + Vite
- Chakra UI
- Axios (with interceptor)
- React Router DOM
- React Confetti, React Use
- FileSaver + Papaparse (CSV Export)
- localStorage for token persistence

---

## 📁 Folder Structure

```
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── color-mode.jsx
│   │   │   ├── provider.jsx
│   │   │   ├── toaster.jsx
│   │   │   └── tooltip.jsx
│   │   └── PrivateRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── AdminFeedbackList.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── SubmitPage.jsx
│   ├── theme/
│   │   └── index.js
│   ├── api.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── theme.js
└── vite.config.js
```

---

## 🌐 API Connection

The frontend communicates with the backend at `VITE_BACKEND_URL`. Set this in `.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

## Installation

bash
cd client
npm install
