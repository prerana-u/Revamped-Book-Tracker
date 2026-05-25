import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import type { ReactNode } from "react";

import HomePage from "./Components/main_components/HomePage";
import Login from "./Login";
import SignupPage from "./Signup";
import Dashboard from "./Components/main_components/UserDashboard/Dashboard";
import { useAuth } from "./context/useAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup-page" element={<SignupPage />} />
        <Route path="/home" element={<HomePage />} />
        {/* Protected dashboard route - only accessible when authenticated */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  // simple auth check - adjust as needed to match your auth implementation
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default App;
