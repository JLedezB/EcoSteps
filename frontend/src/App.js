import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ==============================
// Pages
// ==============================
import LandingPage from "./pages/LandingPage";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmEmail from "./pages/ConfirmEmail";

// Password reset
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Dashboards
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Evidence / Reports
import EvidenceUpload from "./pages/EvidenceUpload";
import AdminEvidenceReview from "./pages/AdminEvidenceReview";
import ReportUpload from "./pages/ReportUpload";
import AdminReportsReview from "./pages/AdminReportsReview";

// Tickets
import UserTickets from "./pages/UserTickets";
import AdminTickets from "./pages/AdminTickets";
import TicketDetail from "./pages/TicketDetail";

// Chatbot (User)
import HelpChatbot from "./pages/HelpChatbot";

// ==============================
// Components
// ==============================
import ProtectedRoute from "./components/ProtectedRoute";

// ==============================
// Smart redirect
// ==============================
const HomeRedirect = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/user" replace />;
};

// ==============================
// App Routes
// ==============================
function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomeRedirect />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

        {/* Password reset */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User (Protected) */}
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
        <Route
          path="/user/help"
          element={
            <ProtectedRoute role="user">
              <HelpChatbot />
            </ProtectedRoute>
          }
        />

        {/* Admin (Protected) */}
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;