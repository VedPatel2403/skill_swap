import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BrowseSkills from './pages/BrowseSkills';
import UserProfile from './pages/UserProfile';
import MyProfile from './pages/MyProfile';
import SwapsDashboard from './pages/SwapsDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import CursorBackgroundGlow from './components/CursorBackgroundGlow';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E05504] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--neo-bg)] text-stone-800 relative overflow-x-hidden">
      {/* Dynamic Background Hover Effect */}
      <CursorBackgroundGlow />
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <main className="flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<BrowseSkills />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/swaps"
                element={
                  <ProtectedRoute>
                    <SwapsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </main>
      <Footer />
      </div>
    </div>
  );
}

export default App;
