import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 0) Landing
import LandingPage from "./pages/LandingPage";

// 1) Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmEmail from "./pages/ConfirmEmail";

// ✅ Password reset pages
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// 2) Dashboards
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// 3) Evidence / Reports
import EvidenceUpload from "./pages/EvidenceUpload";
import AdminEvidenceReview from "./pages/AdminEvidenceReview";

import ReportUpload from "./pages/ReportUpload";
import AdminReportsReview from "./pages/AdminReportsReview";

// 4) Route guard
import ProtectedRoute from "./components/ProtectedRoute";

// 5) Tickets
import UserTickets from "./pages/UserTickets";
import AdminTickets from "./pages/AdminTickets";
import TicketDetail from "./pages/TicketDetail";

// 6) Chatbot (solo user)
import HelpChatbot from "./pages/HelpChatbot";

// Smart redirect
const HomeRedirect = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/user" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* LANDING + AUTH */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

        {/* ✅ PASSWORD RESET */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* USER (Protected) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/evidence/:activityId"
          element={
            <ProtectedRoute role="user">
              <EvidenceUpload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/report"
          element={
            <ProtectedRoute role="user">
              <ReportUpload />
            </ProtectedRoute>
          }
        />

        {/* Tickets USER */}
        <Route
          path="/user/tickets"
          element={
            <ProtectedRoute role="user">
              <UserTickets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/tickets/:id"
          element={
            <ProtectedRoute role="user">
              <TicketDetail />
            </ProtectedRoute>
          }
        />

        {/* Chatbot USER */}
        <Route
          path="/user/help"
          element={
            <ProtectedRoute role="user">
              <HelpChatbot />
            </ProtectedRoute>
          }
        />

        {/* ADMIN (Protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/evidences/:activityId"
          element={
            <ProtectedRoute role="admin">
              <AdminEvidenceReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute role="admin">
              <AdminReportsReview />
            </ProtectedRoute>
          }
        />

        {/* Tickets ADMIN */}
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute role="admin">
              <AdminTickets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tickets/:id"
          element={
            <ProtectedRoute role="admin">
              <TicketDetail />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;