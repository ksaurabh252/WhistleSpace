# 🎯 WhistleSpace – Client (Frontend)

This is the **React + Chakra UI** frontend of **WhistleSpace**, an anonymous feedback platform for teams, campuses, and communities. Users can safely submit feedback, and admins can moderate, filter, and export them through a comprehensive dashboard with advanced user management and privacy protection.

---

## 🚀 Features

### 📝 **Core Feedback System**

- ✅ Anonymous feedback submission with optional email
- ✅ Real-time character count & validation (10-500 chars)
- ✅ AI-powered category & sentiment analysis
- ✅ Confetti animation on successful submission
- ✅ Mobile-first responsive design

### 🔐 **Authentication & Security**

- ✅ Google OAuth integration
- ✅ Traditional email/password authentication
- ✅ JWT-based secure sessions
- ✅ Password reset with email verification
- ✅ Protected routes with role-based access
- ✅ Automatic token refresh and validation

### 👑 **Advanced Admin Dashboard**

- ✅ **Comprehensive Feedback Management:**

  - Pagination with customizable limits
  - Advanced search with keyword highlighting
  - Multi-filter system (category, sentiment, date range, status)
  - Bulk operations (approve/reject/delete)
  - CSV export with custom date ranges
  - Real-time status updates
  - Comment threads on feedback

- ✅ **Enhanced User Management:**

  - Flagged users monitoring with risk assessment
  - Detailed user flag history tracking
  - Bulk user actions (ban/unban/warning/clear flags)
  - User activity metrics and analytics
  - Privacy-focused user interface
  - Real-time security overview

- ✅ **Admin Activity Tracking:**
  - Complete audit log of admin actions
  - Timestamped activity history
  - Admin accountability system
  - Action attribution and notes

### 🛡️ **Privacy & Security Dashboard**

- ✅ **Privacy Metrics:**

  - Overall privacy score calculation
  - Anonymous submission rate tracking
  - Data encryption compliance monitoring
  - GDPR/CCPA compliance indicators
  - Access control effectiveness metrics

- ✅ **Security Features:**
  - End-to-end encryption visualization
  - Zero-knowledge architecture compliance
  - Automatic data purging status
  - Role-based permission overview

### 📱 **User Experience**

- ✅ **Notification System:**

  - Real-time user notifications
  - Warning and ban notifications
  - Unread notification tracking
  - Notification history management
  - Email notification integration

- ✅ **Theme & Accessibility:**
  - Dark/light mode toggle
  - System color mode detection
  - Responsive mobile navigation
  - Accessibility-compliant UI components
  - Loading states and skeleton screens

### 🔄 **Real-time Features**

- ✅ Socket.IO integration for live updates
- ✅ Real-time notification delivery
- ✅ Live admin dashboard updates
- ✅ Instant feedback status changes

---

## 🧱 Tech Stack

- **Frontend Framework:** React 18 + Vite
- **UI Library:** Chakra UI v3 with custom theme
- **Authentication:** Google OAuth + JWT
- **HTTP Client:** Axios with interceptors
- **Routing:** React Router DOM v6
- **State Management:** React Context + Hooks
- **Real-time:** Socket.IO Client
- **Animations:** React Confetti
- **Data Export:** Papaparse + FileSaver
- **Form Validation:** Built-in + Custom validators
- **Storage:** localStorage for token persistence

---

## 📁 Enhanced Folder Structure

```
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   │   └── GoogleAuthButton.jsx
│   │   ├── ui/
│   │   │   ├── color-mode.jsx
│   │   │   ├── provider.jsx
│   │   │   ├── toaster.jsx
│   │   │   └── tooltip.jsx
│   │   ├── AdminPrivacyDashboard.jsx
│   │   ├── Navigation.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── UserManagement.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── AdminFeedbackList.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── SubmitPage.jsx
│   │   └── UserDashboard.jsx
│   ├── theme/
│   │   └── index.js
│   ├── utils/
│   │   └── errorHandler.jsx
│   ├── api.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── theme.js
└── vite.config.js
```

---

## 🌐 Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Optional: Analytics & Monitoring
VITE_ANALYTICS_ID=your_analytics_id
```

---

## 🛠️ Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd whistlespace/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔑 Key Components Overview

### **Authentication Flow**

- `LoginPage.jsx` - Admin login with Google OAuth
- `SignupPage.jsx` - Admin registration
- `AuthContext.jsx` - Global authentication state
- `PrivateRoute.jsx` - Protected route wrapper

### **Admin Dashboard**

- `AdminFeedbackList.jsx` - Main feedback management
- `UserManagement.jsx` - Advanced user administration
- `AdminPrivacyDashboard.jsx` - Privacy & security metrics

### **User Interface**

- `SubmitPage.jsx` - Anonymous feedback submission
- `UserDashboard.jsx` - User notifications & profile
- `LandingPage.jsx` - Public homepage

### **Utility Components**

- `Navigation.jsx` - Responsive navigation bar
- `GoogleAuthButton.jsx` - OAuth integration
- `errorHandler.jsx` - Centralized error management

---

## 🚦 Available Routes

```javascript
// Public Routes
/ - Landing page
/submit - Feedback submission
/login - Admin login
/signup - Admin registration

// Protected Admin Routes
/admin - Main admin dashboard
/admin/users - User management interface

// Protected User Routes
/user/dashboard - User notifications & profile
```

---

## 🔧 API Integration

The frontend communicates with the backend through:

- **REST API** endpoints for CRUD operations
- **Socket.IO** for real-time notifications
- **JWT tokens** for secure authentication
- **File uploads** for CSV exports

### API Client Configuration

```javascript
// api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  timeout: 10000,
});

// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🎨 Theme Customization

The app uses a custom Chakra UI theme with:

- **Color Modes:** Light/Dark theme support
- **Brand Colors:** Customizable color palette
- **Typography:** System fonts with serif headings
- **Component Variants:** Enhanced button and form styles

```javascript
// theme/index.js
const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      100: "#f7fafc",
      // ... custom brand colors
    },
  },
  // ... component customizations
});
```

---

## 🔒 Security Features

- **XSS Protection:** Input sanitization and validation
- **CSRF Protection:** CORS configuration
- **JWT Security:** Automatic token refresh
- **Privacy First:** No sensitive data logging
- **Encryption:** Client-side data protection

---

## 📱 Mobile Responsiveness

- **Responsive Design:** Mobile-first approach
- **Touch Friendly:** Optimized for touch interfaces
- **Performance:** Optimized loading and rendering
- **PWA Ready:** Service worker support

---

## 🚀 Performance Optimizations

- **Code Splitting:** Route-based lazy loading
- **Bundle Optimization:** Vite build optimizations
- **Caching:** Efficient API response caching
- **Image Optimization:** Responsive image loading

---

## 🐛 Development Tools

```bash
# Linting
npm run lint

# Type checking (if using TypeScript)
npm run type-check

# Bundle analysis
npm run build --analyze

# Testing (if tests are added)
npm run test
```

---

## 📈 Analytics & Monitoring

The platform includes:

- **User Activity Tracking:** Anonymous usage metrics
- **Performance Monitoring:** Page load times
- **Error Tracking:** Client-side error reporting
- **Privacy Compliance:** GDPR-compliant analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**WhistleSpace** - Empowering safe, anonymous feedback for better communities. 🎯
