import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import PositionsPage from "./pages/PositionsPage.jsx";
import PositionDetailPage from "./pages/PositionDetailPage.jsx";
import AttributeLibraryPage from "./pages/AttributeLibraryPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CVPage from "./pages/CVPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/positions/:id" element={<PositionDetailPage />} />
        <Route
          path="/attributes"
          element={
            <ProtectedRoute roles={["recruiter"]}>
              <AttributeLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route
          path="/cvs/:id"
          element={
            <ProtectedRoute>
              <CVPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
