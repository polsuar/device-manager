import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import HeartRate from "./pages/HeartRate";
import Location from "./pages/Location";
import Battery from "./pages/Battery";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";

function App() {
  // Temporalmente establecemos isAuthenticated como true para bypassear el login
  const isAuthenticated = true;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/devices" element={<Devices />} />
                      <Route path="/heart-rate" element={<HeartRate />} />
                      <Route path="/location" element={<Location />} />
                      <Route path="/battery" element={<Battery />} />
                      <Route path="/notifications" element={<Notifications />} />
                    </Routes>
                  </DashboardLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
