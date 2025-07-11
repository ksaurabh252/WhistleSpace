# 🎯 WhistleSpace - Anonymous Feedback Platform

<div align="center">

**A complete anonymous feedback system with AI-powered moderation and real-time admin dashboard**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

[🚀 Live Demo](https://whistlespace.vercel.app) | [📖 Frontend Docs](./frontend/README.md) | [⚙️ Backend Docs](./backend/README.md)

</div>

---

## 📋 Table of Contents

- [What is WhistleSpace?](#-what-is-whistlespace)
- [Key Features Demo](#-key-features-demo)
- [System Architecture](#-system-architecture)
- [Complete Setup Guide](#-complete-setup-guide)
- [How to Use](#-how-to-use)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🌟 What is WhistleSpace?

WhistleSpace enables organizations to collect **anonymous feedback** safely and efficiently. Users can submit concerns, suggestions, or praise without fear of retaliation, while administrators get powerful tools to manage, moderate, and respond to feedback.

### 🎯 **Perfect For:**

- **Schools & Universities** - Student feedback and reporting
- **Startups & Companies** - Employee feedback and HR concerns
- **Communities** - Public feedback and issue reporting
- **Organizations** - Anonymous surveys and suggestion boxes

---

## ✨ Key Features Demo

### 📝 **Anonymous Feedback Submission**

```
1. User visits: http://localhost:5173/submit
2. Writes feedback (10-500 characters)
3. Optionally provides email for follow-up
4. AI automatically categorizes as: Harassment, Suggestion, Technical, Praise, Other
5. System analyzes sentiment: Positive, Negative, Neutral
6. Confetti animation confirms successful submission
```

### 👑 **Admin Dashboard Features**

```
1. Login at: http://localhost:5173/admin
2. View all feedback with:
   - Real-time search and filtering
   - Category and sentiment analysis
   - Approval/rejection tools
   - CSV export functionality
   - Comment threads

3. Advanced User Management:
   - Monitor flagged users with risk levels
   - Progressive warning system (3 strikes)
   - Automatic bans for harassment
   - Bulk user operations
```

### 🔔 **Real-time Notifications**

```
1. Users receive notifications for:
   - Account warnings
   - Temporary bans
   - Account status changes

2. Admins get alerts for:
   - Harassment detection
   - User violations
   - System security events
```

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Express API    │    │    MongoDB      │
│   (Port 5173)   │◄──►│   (Port 5000)    │◄──►│   Database      │
│                 │    │                  │    │                 │
│ • Submit Form   │    │ • JWT Auth       │    │ • Feedback      │
│ • Admin Panel   │    │ • AI Processing  │    │ • Users         │
│ • Notifications │    │ • Email Alerts   │    │ • Admins        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                 ┌─────────────┐   ┌─────────────┐
                 │   OpenAI    │   │    Redis    │
                 │   (AI API)  │   │  (Caching)  │
                 └─────────────┘   └─────────────┘
```

**Data Flow:**

1. **Feedback Submission** → AI Analysis → Database Storage → Admin Notification
2. **Admin Action** → Database Update → User Notification → Audit Log
3. **Real-time Updates** → Socket.IO → Live Dashboard Updates

---

## ⚡ Complete Setup Guide

### **Prerequisites**

```bash
# Required
✅ Node.js 18+ (Download: https://nodejs.org)
✅ MongoDB (Local or Atlas: https://mongodb.com)
✅ Git (Download: https://git-scm.com)

# API Keys Needed
✅ OpenAI API Key (https://platform.openai.com/api-keys)
✅ Google OAuth Credentials (https://console.cloud.google.com)
✅ Gmail App Password (for email notifications)
```

### **Step 1: Clone & Install**

```bash
# Clone repository
git clone https://github.com/ksaurabh252/whistlespace.git
cd whistlespace

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **Step 2: Environment Configuration**

**Backend Environment (`backend/.env`):**

```env
# Core Settings
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/whistlespace

# Security
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key_here

# AI & Auth Services
OPENAI_API_KEY=sk-your_openai_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Email Configuration
ADMIN_EMAIL=your-admin@gmail.com
ADMIN_EMAIL_PASS=your_gmail_app_password

# Default Admin Account
DEFAULT_ADMIN_EMAIL=admin@whistlespace.com
DEFAULT_ADMIN_PASSWORD=Admin123!
```

**Frontend Environment (`frontend/.env`):**

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### **Step 3: Database Setup**

```bash
# Start MongoDB (choose your OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Create default admin account
cd backend
npm run seed-admin
```

### **Step 4: Launch Application**

```bash
# Terminal 1: Start Backend
cd backend
npm run dev
✅ Server running on port 5000

# Terminal 2: Start Frontend
cd frontend
npm run dev
✅ Local: http://localhost:5173
```

### **Step 5: Verify Setup**

```bash
# Test backend health
curl http://localhost:5000/health
# Should return: {"status":"OK"}

# Test frontend
# Visit: http://localhost:5173
# Should show WhistleSpace landing page
```

---

## 🎮 How to Use

### **For End Users (Anonymous Feedback)**

1. **Submit Feedback:**

   ```
   Navigate to: http://localhost:5173/submit
   → Write your feedback (10-500 characters)
   → Optionally add email for follow-up
   → Click "Submit"
   → See confetti animation on success!
   ```

2. **Check Status (if email provided):**
   ```
   → Receive email notifications about feedback status
   → AI categorizes your feedback automatically
   → Admin may add comments or take action
   ```

### **For Administrators**

1. **Login to Dashboard:**

   ```
   Navigate to: http://localhost:5173/admin
   Email: admin@whistlespace.com
   Password: Admin123!
   ```

2. **Manage Feedback:**

   ```
   → View all submissions with AI analysis
   → Filter by category, sentiment, date range
   → Approve/Reject/Delete feedback
   → Add comments and notes
   → Export data to CSV
   ```

3. **User Management:**

   ```
   → Monitor flagged users and risk levels
   → Issue warnings or temporary bans
   → View detailed user activity history
   → Perform bulk operations
   ```

4. **Privacy Dashboard:**
   ```
   → Monitor system privacy score
   → Track anonymity rates
   → Review compliance metrics
   → Audit admin actions
   ```

### **Key User Flows**

**Flow 1: Anonymous Feedback Submission**

```
User visits submit page → Writes feedback → AI analyzes content →
Stores in database → Notifies admin if harassment detected →
Shows success message with confetti
```

**Flow 2: Admin Moderation**

```
Admin logs in → Views feedback list → Filters/searches content →
Reviews AI analysis → Approves/rejects → Adds comments →
User gets notified via email
```

**Flow 3: User Warning System**

```
AI detects harassment → Auto-issues warning → User gets notification →
3 warnings = temporary ban → Admin gets alert → Ban lifted automatically
```

---

## 📁 Project Structure

```
WhistleSpace/
├── 📂 frontend/                 # React + Chakra UI Application
│   ├── src/components/          # UI Components (Navigation, Auth, etc.)
│   ├── src/pages/              # Main Pages (Submit, Admin, Login)
│   ├── src/context/            # React Context (Auth, Theme)
│   └── README.md               # Frontend-specific documentation
│
├── 📂 backend/                  # Node.js + Express API
│   ├── controller/             # Business Logic (Auth, Feedback, Users)
│   ├── models/                 # MongoDB Schemas (User, Admin, Feedback)
│   ├── routes/                 # API Endpoints (/api/feedback, /api/admin)
│   ├── middleware/             # Auth & Validation Middleware
│   ├── utils/                  # AI Processing, Notifications, Redis
│   └── README.md               # Backend-specific documentation
│
├── 📂 docs/                     # Additional Documentation
└── README.md                   # This main project guide
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Backend Issues**

**❌ MongoDB Connection Failed**

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Test connection
cd backend && npm run test-connection
```

**❌ OpenAI API Errors**

```bash
# Verify API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Common issues:
- Invalid API key format
- Insufficient credits/billing
- Rate limit exceeded
```

**❌ Email Notifications Not Working**

```bash
# Gmail setup checklist:
1. Enable 2-Factor Authentication
2. Generate App Password (not regular password)
3. Use App Password in ADMIN_EMAIL_PASS
4. Check Gmail SMTP settings
```

#### **Frontend Issues**

**❌ CORS Errors**

```bash
# Ensure backend FRONTEND_URL matches frontend URL
Backend .env: FRONTEND_URL=http://localhost:5173
Frontend should run on: http://localhost:5173
```

**❌ Google OAuth Not Working**

```bash
# Check Google OAuth setup:
1. Correct Client ID in both .env files
2. Authorized origins include: http://localhost:5173
3. OAuth consent screen configured
```

#### **General Issues**

**❌ Port Already in Use**

```bash
# Kill processes on ports
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -ti:5000 | xargs kill -9

# Or change ports in .env files
```

**❌ Dependencies Issues**

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

---

## 💻 System Requirements

| Component   | Minimum        | Recommended           |
| ----------- | -------------- | --------------------- |
| **Node.js** | 18.0+          | 20.0+                 |
| **MongoDB** | 6.0+           | 7.0+                  |
| **RAM**     | 2GB            | 4GB                   |
| **Storage** | 1GB            | 5GB                   |
| **Browser** | Modern browser | Chrome/Firefox latest |

---

## 🚀 Production Deployment

### **Quick Deploy Options**

**Option 1: Vercel + Railway**

```bash
# Frontend (Vercel)
cd frontend && vercel --prod

# Backend (Railway)
cd backend && railway deploy
```

**Option 2: Docker**

```bash
# Build and run with Docker
docker-compose up -d
```

**See detailed deployment guides:**

- [Frontend Deployment](./frontend/README.md#deployment)
- [Backend Deployment](./backend/README.md#deployment)

---

## 🧪 Testing the System

### **Manual Testing Checklist**

```bash
✅ Submit anonymous feedback → Check AI categorization
✅ Submit harassment content → Verify warning system
✅ Login as admin → Check dashboard functionality
✅ Approve/reject feedback → Verify status updates
✅ Ban user → Check notification system
✅ Export CSV → Verify data export
✅ Google OAuth → Test authentication
✅ Real-time updates → Test Socket.IO connection
```

### **API Testing**

```bash
# Test feedback submission
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test feedback message","email":"test@example.com"}'

# Test health endpoint
curl http://localhost:5000/health
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **Development Workflow**

```bash
1. Fork repository
2. Create feature branch: git checkout -b feature/amazing-feature
3. Make changes and test locally
4. Commit: git commit -m 'feat: add amazing feature'
5. Push and create Pull Request
```

### **Code Standards**

- **ESLint & Prettier** for code formatting
- **Conventional Commits** for commit messages
- **JSDoc** for function documentation
- **Test coverage** for new features

### **Areas for Contribution**

- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📖 Documentation improvements
- 🧪 Test coverage expansion
- 🎨 UI/UX improvements

---

## 📞 Support & Resources

- **📖 Frontend Documentation:** [./frontend/README.md](./frontend/README.md)
- **⚙️ Backend Documentation:** [./backend/README.md](./backend/README.md)
- **🐛 Report Issues:** [GitHub Issues](https://github.com/your-org/whistlespace/issues)
- **💬 Community:** [Discord](https://discord.gg/whistlespace)
- **📧 Email:** support@whistlespace.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**🎯 Ready to empower your community with safe, anonymous feedback?**

[⭐ Star this repo](https://github.com/your-org/whistlespace) • [🚀 Deploy now](https://vercel.com) • [💬 Join community](https://discord.gg/whistlespace)

**Built with ❤️ for creating safer, more transparent organizations**

</div>
