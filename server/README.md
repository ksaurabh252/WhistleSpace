# 📡 WhistleSpace – Server (Backend)

This is the **Node.js/Express** backend API for **WhistleSpace**, a comprehensive anonymous feedback platform with advanced AI-powered moderation, user management, privacy protection, and real-time notifications. Built with **MongoDB**, **OpenAI integration**, **Socket.IO**, and enterprise-grade security features.

---

## 🚀 Core Features

### 📝 **Feedback Management**

- ✅ Anonymous feedback submission with optional email
- ✅ AI-powered categorization and sentiment analysis
- ✅ Advanced search, pagination, and multi-filter system
- ✅ Admin moderation tools (approve/reject/delete/comment)
- ✅ CSV export with custom date ranges
- ✅ Real-time status updates via Socket.IO
- ✅ Threaded comments with anonymous/admin attribution

### 🛡️ **Advanced User Management**

- ✅ **Flagged User Monitoring:**

  - Risk-level assessment (LOW/MEDIUM/HIGH/CRITICAL)
  - Comprehensive flag history tracking
  - User activity metrics and analytics
  - Bulk user operations (ban/unban/warning/clear flags)

- ✅ **Automated Moderation System:**
  - Progressive warning system (3-strike policy)
  - Automatic temporary bans for repeat violations
  - Harassment detection with immediate action
  - Real-time admin alerts for critical content

### 🔐 **Authentication & Security**

- ✅ **Multi-Auth Support:**

  - Google OAuth 2.0 integration
  - Traditional email/password authentication
  - JWT token-based sessions with refresh
  - Password reset with email verification

- ✅ **Enterprise Security:**
  - Bcrypt password hashing (12 rounds)
  - Rate limiting and DDoS protection
  - CORS configuration
  - Helmet.js security headers
  - Input validation and sanitization

### 🔒 **Privacy & Compliance**

- ✅ **Data Protection:**

  - End-to-end email encryption
  - Zero-knowledge user identification
  - GDPR/CCPA compliance features
  - Automatic data purging policies
  - Anonymous feedback processing

- ✅ **Privacy Metrics:**
  - Privacy score calculation
  - Anonymity rate tracking
  - Encryption compliance monitoring
  - Access control effectiveness

### 📧 **Notification System**

- ✅ **Multi-Channel Notifications:**

  - In-app notification system
  - Email notifications with templates
  - Real-time Socket.IO updates
  - Admin alert system for violations

- ✅ **Templated Messaging:**
  - Warning escalation templates
  - Ban notification templates
  - Welcome and onboarding messages
  - Privacy policy updates

### 🤖 **AI Integration**

- ✅ **OpenAI-Powered Analysis:**
  - Automatic content categorization
  - Sentiment analysis and scoring
  - Harassment detection algorithms
  - Redis caching for performance

---

## 🧱 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.x
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Google OAuth 2.0
- **AI:** OpenAI GPT-3.5-turbo
- **Caching:** Redis for AI responses
- **Real-time:** Socket.IO
- **Email:** Nodemailer with Gmail SMTP
- **Security:** Helmet, bcryptjs, express-rate-limit
- **Validation:** express-validator
- **File Processing:** Papaparse for CSV exports
- **Environment:** dotenv for configuration

---

## 📁 Complete Folder Structure

```
├── controller/
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── feedback.controller.js
│   └── user.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── Admin.model.js
│   ├── Feedback.model.js
│   └── User.model.js
├── routes/
│   ├── admin.routes.js
│   ├── feedback.routes.js
│   ├── test.routes.js
│   └── user.routes.js
├── scripts/
│   ├── resetAdmin.js
│   └── seedAdmin.js
├── utils/
│   ├── ai.js
│   ├── errorCodes.js
│   ├── notifications.js
│   └── redis.client.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── server.js
├── test-connection.js
└── test.routes.js
```

---

## ⚙️ Environment Configuration

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/whistlespace
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
OPENAI_API_KEY=sk-your_openai_api_key_here
ADMIN_EMAIL=your-admin@gmail.com
ADMIN_EMAIL_PASS=your_gmail_app_password
EMAIL_USER=notifications@yourdomain.com
EMAIL_PASS=your_email_app_password
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
DEFAULT_ADMIN_EMAIL=admin@whistlespace.com
DEFAULT_ADMIN_PASSWORD=Admin123!
DEFAULT_ADMIN_NAME=WhistleSpace Administrator
```

---

## 🛠️ Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd whistlespace/server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Seed admin account
npm run seed-admin

# Start server
npm run dev
```

---

## 📡 API Documentation

Includes routes for:

- **Authentication**
- **Feedback CRUD + AI tagging**
- **User management**
- **Notifications**
- **Admin logs + audit trail**
- **Health checks & test endpoints**

Full endpoint documentation provided earlier.

---

## 🔒 Security Highlights

- JWT authentication & refresh tokens
- Email encryption with AES
- Input sanitization + express-validator
- DDoS protection via rate limiting
- Helmet.js for HTTP headers

---

## 🤖 AI Integration

- Uses OpenAI GPT-3.5 for categorization, sentiment, moderation
- Results cached in Redis (1-hour TTL)
- Integrated into `feedback.controller.js`

---

## 📊 Monitoring & Analytics

- Privacy score calculation
- Anonymity metrics
- Flagged user insights
- System health and cache stats

---

## 🤝 Contributing

1. Fork repo
2. Create feature branch
3. Commit and push
4. Open PR with details

---

**WhistleSpace Backend** – Built for anonymous safety, moderation intelligence, and compliance-first feedback systems.
