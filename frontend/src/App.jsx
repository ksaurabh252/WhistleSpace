import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminRoute from "./components/AdminRoute";

const FeedbackBoard = lazy(() => import("./pages/FeedbackBoard"));
const FeedbackDetails = lazy(() => import("./pages/FeedbackDetails"));
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Layout>

          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<FeedbackBoard />} />
              <Route path="/feedback/:id" element={<FeedbackDetails />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
