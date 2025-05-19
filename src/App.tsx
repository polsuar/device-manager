import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Devices from "./pages/Devices";
import HeartRate from "./pages/HeartRate";
import Location from "./pages/Location";
import Battery from "./pages/Battery";
import NetworkLogs from "./pages/NetworkLogs";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import Fallcare3DPage from "./pages/Fallcare3DPage";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="devices" element={<Devices />} />
            <Route path="heart-rate" element={<HeartRate />} />
            <Route path="location" element={<Location />} />
            <Route path="battery" element={<Battery />} />
            <Route path="network-logs" element={<NetworkLogs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="fallcare-3d" element={<Fallcare3DPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
