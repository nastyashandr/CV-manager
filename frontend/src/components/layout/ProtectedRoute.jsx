import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) return <LoadingSpinner label={t("loading")} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return children;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
