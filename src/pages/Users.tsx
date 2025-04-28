import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  DevicesOther as DevicesIcon,
  BatteryFull as BatteryIcon,
  Favorite as HeartRateIcon,
  Wifi as WifiIcon,
  Visibility as ViewIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { db } from "../config/firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface UserStats {
  userId: string;
  email: string;
  totalDevices: number;
  activeDevices: number;
  averageBattery: number;
  averageHeartRate: number;
  devicesWithLocation: number;
  lastActivity: number;
}

interface Measurement {
  timestamp: number;
  type: string;
  value: any;
  measurements: {
    location?: {
      lat: number;
      long: number;
      timestamp: number;
    };
    heart_rate?: number[];
    ssid?: string;
    plugged?: boolean;
  };
}

interface UserBasic {
  userId: string;
  email: string;
}

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userMeasurements, setUserMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData: UserBasic[] = usersSnapshot.docs.map((userDoc) => ({
          userId: userDoc.id,
          email: userDoc.data().email || "Unknown",
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleViewUserDetails = async (userId: string) => {
    setSelectedUser(userId);
    setLoading(true);
    try {
      const eventsRef = collection(doc(db, "users", userId), "EVENTS");
      const eventsSnapshot = await getDocs(eventsRef);
      const measurements = eventsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const eventKey = Object.keys(data)[0];
        const eventData = data[eventKey];
        return {
          timestamp: parseInt(doc.id),
          type: eventKey.split(".")[0],
          value: eventData.value,
          measurements: eventData.measurements || {},
        };
      });
      setUserMeasurements(measurements);
      // Calcular stats solo para este usuario
      const wifiEvents = measurements.filter((m) => m.type === "wifi_connected");
      const batteryEvents = measurements.filter((m) => m.type === "low_battery");
      setUserStats({
        userId,
        email: users.find((u) => u.userId === userId)?.email || "Unknown",
        totalDevices: 1,
        activeDevices: wifiEvents.filter((e) => e.value).length > 0 ? 1 : 0,
        averageBattery: batteryEvents.length > 0 ? batteryEvents.reduce((acc, curr) => acc + curr.value, 0) / batteryEvents.length : 0,
        averageHeartRate: 0,
        devicesWithLocation: measurements.filter((m) => m.measurements?.location?.lat !== 0).length,
        lastActivity: measurements.length > 0 ? Math.max(...measurements.map((m) => m.timestamp)) : 0,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Icon sx={{ color, mr: 1 }} />
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  // Helper functions to format date
  const formatHour = (timestamp: number) => {
    const date = new Date(timestamp);
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  };
  const formatMonthDayHour = (timestamp: number) => {
    const date = new Date(timestamp);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} ${hh}:${min}`;
  };

  // Helper function to filter last 24h data with activity for a specific type
  const getLast24HDataByType = (data: Measurement[], type: string) => {
    const filtered = data.filter((m) => m.type === type);
    if (filtered.length === 0) return [];
    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
    const lastTimestamp = sorted[sorted.length - 1].timestamp;
    const twentyFourHoursBeforeLast = lastTimestamp - 24 * 60 * 60 * 1000;
    return sorted.filter((m) => m.timestamp >= twentyFourHoursBeforeLast);
  };

  // Chart component with expansion capability
  const ChartContainer = ({ title, children, chartId }: { title: string; children: React.ReactNode; chartId: string }) => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={() => setExpandedChart(chartId)}>
          <ZoomInIcon />
        </IconButton>
      </Box>
      {children}
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users Overview
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !selectedUser && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>{user.userId}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewUserDetails(user.userId)}>
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedUser && userStats && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h5">User Details: {userStats.userId}</Typography>
            <IconButton
              onClick={() => {
                setSelectedUser(null);
                setUserStats(null);
                setUserMeasurements([]);
              }}
            >
              <ViewIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Total Devices" value={userStats.totalDevices} icon={DevicesIcon} color="#1976d2" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Active Devices" value={userStats.activeDevices} icon={WifiIcon} color="#2e7d32" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Avg Battery" value={`${userStats.averageBattery.toFixed(1)}%`} icon={BatteryIcon} color="#ed6c02" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Avg Heart Rate" value={`${userStats.averageHeartRate} bpm`} icon={HeartRateIcon} color="#d32f2f" />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ChartContainer title="Device Status (On/Off Body)" chartId="device-status">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={getLast24HDataByType(userMeasurements, "off_body").map((m) => ({
                        timestamp: formatHour(m.timestamp),
                        rawTimestamp: m.timestamp,
                        status: m.value ? "Off" : "On",
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis dataKey="status" type="category" domain={["Off", "On"]} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="status" stroke="#1976d2" name="Device Status" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartContainer title="WiFi Connection Status" chartId="wifi-status">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={getLast24HDataByType(userMeasurements, "wifi_connected").map((m) => ({
                        timestamp: formatHour(m.timestamp),
                        rawTimestamp: m.timestamp,
                        connected: m.value ? "On" : "Off",
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis dataKey="connected" type="category" domain={["Off", "On"]} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="connected" stroke="#2e7d32" name="WiFi Status" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartContainer title="Battery Level" chartId="battery-level">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={getLast24HDataByType(userMeasurements, "low_battery").map((m) => ({
                        timestamp: formatHour(m.timestamp),
                        rawTimestamp: m.timestamp,
                        battery: m.value,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="battery" stroke="#ed6c02" name="Battery Level (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartContainer title="Button Press Events" chartId="button-press">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(() => {
                        const buttonPress = getLast24HDataByType(userMeasurements, "button_press");
                        const notificationPress = getLast24HDataByType(userMeasurements, "notification_button_press");
                        // Unir ambos tipos y ordenar por timestamp
                        const merged = [...buttonPress, ...notificationPress].sort((a, b) => a.timestamp - b.timestamp);
                        return merged.map((m) => ({
                          timestamp: formatHour(m.timestamp),
                          rawTimestamp: m.timestamp,
                          buttonPress: m.type === "button_press" ? 1 : 0,
                          notificationPress: m.type === "notification_button_press" ? 1 : 0,
                        }));
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Bar dataKey="buttonPress" stackId="a" fill="#9c27b0" name="Button Press" />
                      <Bar dataKey="notificationPress" stackId="a" fill="#673ab7" name="Notification Button Press" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Grid>
            </Grid>
          </Box>

          {/* Expanded Chart Dialog */}
          <Dialog open={!!expandedChart} onClose={() => setExpandedChart(null)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {expandedChart === "device-status" && "Device Status History"}
              {expandedChart === "wifi-status" && "WiFi Connection History"}
              {expandedChart === "battery-level" && "Battery Level History"}
              {expandedChart === "button-press" && "Button Press History"}
              <IconButton onClick={() => setExpandedChart(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ height: "70vh", width: "100%" }}>
                {expandedChart === "device-status" && (
                  <ResponsiveContainer>
                    <LineChart
                      data={getLast24HDataByType(userMeasurements, "off_body").map((m) => ({
                        timestamp: formatHour(m.timestamp),
                        rawTimestamp: m.timestamp,
                        status: m.value ? "Off" : "On",
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis dataKey="status" type="category" domain={["Off", "On"]} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="status" stroke="#1976d2" name="Device Status" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {expandedChart === "wifi-status" && (
                  <ResponsiveContainer>
                    <LineChart
                      data={getLast24HDataByType(userMeasurements, "wifi_connected").map((m) => ({
                        timestamp: formatHour(m.timestamp),
                        rawTimestamp: m.timestamp,
                        connected: m.value ? "On" : "Off",
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis dataKey="connected" type="category" domain={["Off", "On"]} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="connected" stroke="#2e7d32" name="WiFi Status" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {expandedChart === "battery-level" && (
                  <ResponsiveContainer>
                    <LineChart
                      data={getLast24HDataByType(userMeasurements, "low_battery").map((m) => ({
                        timestamp: formatHour(m.timestamp),
                        rawTimestamp: m.timestamp,
                        battery: m.value,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="battery" stroke="#ed6c02" name="Battery Level (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {expandedChart === "button-press" && (
                  <ResponsiveContainer>
                    <BarChart
                      data={(() => {
                        const buttonPress = getLast24HDataByType(userMeasurements, "button_press");
                        const notificationPress = getLast24HDataByType(userMeasurements, "notification_button_press");
                        // Unir ambos tipos y ordenar por timestamp
                        const merged = [...buttonPress, ...notificationPress].sort((a, b) => a.timestamp - b.timestamp);
                        return merged.map((m) => ({
                          timestamp: formatHour(m.timestamp),
                          rawTimestamp: m.timestamp,
                          buttonPress: m.type === "button_press" ? 1 : 0,
                          notificationPress: m.type === "notification_button_press" ? 1 : 0,
                        }));
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                      />
                      <Legend />
                      <Bar dataKey="buttonPress" stackId="a" fill="#9c27b0" name="Button Press" />
                      <Bar dataKey="notificationPress" stackId="a" fill="#673ab7" name="Notification Button Press" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </DialogContent>
          </Dialog>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Events
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userMeasurements
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 5)
                      .map((m) => (
                        <TableRow key={m.timestamp}>
                          <TableCell>{formatMonthDayHour(m.timestamp)}</TableCell>
                          <TableCell>{m.type}</TableCell>
                          <TableCell>{m.value !== null ? (m.value ? "Success" : "Error") : "N/A"}</TableCell>
                          <TableCell>
                            {m.measurements?.location && m.measurements.location.lat !== 0 && m.measurements.location.long !== 0
                              ? `${m.measurements.location.lat.toFixed(6)}, ${m.measurements.location.long.toFixed(6)}`
                              : "No location"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
