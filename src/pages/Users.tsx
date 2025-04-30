import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useEnvironment } from "../contexts/EnvironmentContext";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
} from "@mui/material";
import {
  DevicesOther as DevicesIcon,
  BatteryFull as BatteryIcon,
  Favorite as HeartRateIcon,
  Wifi as WifiIcon,
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { collection, getDocs, doc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

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

interface ChartDateRange {
  startDate: Date;
  endDate: Date;
}

export default function Users() {
  const { user } = useAuth();
  const { getFirebase } = useEnvironment();
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserBasic[]>([]);
  const [searchId, setSearchId] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userMeasurements, setUserMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [chartDateRanges, setChartDateRanges] = useState<Record<string, ChartDateRange>>({
    "device-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "wifi-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "battery-level": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "button-press": { startDate: subDays(new Date(), 1), endDate: new Date() },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { db } = getFirebase();

      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersData: UserBasic[] = usersSnapshot.docs.map((userDoc) => ({
        userId: userDoc.id,
        email: userDoc.data().email || "Unknown",
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Error al cargar los usuarios. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    setSelectedUser(userId);
    setLoading(true);
    try {
      const { db } = getFirebase();
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

      const wifiEvents = measurements.filter((m) => m.type === "wifi_connected");
      const batteryEvents = measurements.filter((m) => m.type === "low_battery");
      const fallEvents = measurements.filter((m) => m.type === "probable_fall");
      const offBodyEvents = measurements.filter((m) => m.type === "off_body");

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
      setError("Error al cargar los detalles del usuario. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [getFirebase]);

  useEffect(() => {
    if (searchId.trim() === "") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => user.userId.toLowerCase().includes(searchId.toLowerCase())));
    }
  }, [searchId, users]);

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
      <Icon sx={{ color, fontSize: 40 }} />
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Paper>
  );

  const formatHour = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n${day}/${month}`;
  };

  const formatMonthDayHour = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLast24HDataByType = (data: Measurement[], type: string) => {
    const filtered = data.filter((m) => m.type === type);
    if (filtered.length === 0) return [];
    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
    const lastTimestamp = sorted[sorted.length - 1].timestamp;
    const twentyFourHoursBeforeLast = lastTimestamp - 24 * 60 * 60 * 1000;
    return sorted.filter((m) => m.timestamp >= twentyFourHoursBeforeLast);
  };

  const handleDateRangeChange = (chartId: string, field: "startDate" | "endDate", value: Date) => {
    setChartDateRanges((prev) => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        [field]: value,
      },
    }));
  };

  const generateContinuousData = (measurements: Measurement[], type: string, chartId?: string) => {
    let events = measurements.filter((m) => m.type === type).sort((a, b) => a.timestamp - b.timestamp);
    if (events.length === 0) return [];

    if (chartId) {
      const { startDate, endDate } = chartDateRanges[chartId];
      const start = startOfDay(startDate).getTime();
      const end = endOfDay(endDate).getTime();
      events = events.filter((m) => m.timestamp >= start && m.timestamp <= end);
    } else {
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      const lastBeforeCutoff = events.filter((e) => e.timestamp < twentyFourHoursAgo).pop();
      events = events.filter((m) => m.timestamp >= twentyFourHoursAgo);

      if (lastBeforeCutoff) {
        events.unshift({
          ...lastBeforeCutoff,
          timestamp: twentyFourHoursAgo,
        });
      }
    }

    if (events.length === 0) return [];

    const continuousData = [];
    for (let i = 0; i < events.length; i++) {
      const current = events[i];
      const next = events[i + 1];

      continuousData.push({
        timestamp: formatHour(current.timestamp),
        rawTimestamp: current.timestamp,
        value: current.value,
      });

      if (next) {
        continuousData.push({
          timestamp: formatHour(next.timestamp),
          rawTimestamp: next.timestamp - 1,
          value: current.value,
        });
      }
    }

    if (!chartId) {
      const now = Date.now();
      const lastEvent = events[events.length - 1];
      continuousData.push({
        timestamp: formatHour(now),
        rawTimestamp: now,
        value: lastEvent.value,
      });
    }

    return continuousData;
  };

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

  if (loading && !selectedUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users Overview
      </Typography>

      {!selectedUser && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Buscar por ID de usuario"
            variant="outlined"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              },
            }}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#1976d2",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: "bold",
                    },
                  }}
                >
                  <TableCell sx={{ pl: 3, width: 220 }}>User ID</TableCell>
                  <TableCell sx={{ textAlign: "right", pr: 3, width: 180 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.userId} hover>
                    <TableCell sx={{ pl: 3 }}>{user.userId}</TableCell>
                    <TableCell sx={{ textAlign: "right", pr: 3 }}>
                      <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleViewUserDetails(user.userId)}>
                        Eventos
                      </Button>
                      <Button variant="outlined" size="small" color="warning" disabled>
                        Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
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
                setChartDateRanges({
                  "device-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "wifi-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "battery-level": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "button-press": { startDate: subDays(new Date(), 1), endDate: new Date() },
                });
              }}
            >
              <ArrowBackIcon />
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
                    <AreaChart
                      data={generateContinuousData(userMeasurements, "off_body", "device-status").map((m) => ({
                        ...m,
                        status: m.value ? 0 : 1,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <YAxis type="number" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => (value === 1 ? "On" : "Off")} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                        formatter={(value: any) => [value === 1 ? "On" : "Off", "Status"]}
                      />
                      <Legend />
                      <Area type="stepAfter" dataKey="status" stroke="#1976d2" fill="#1976d2" fillOpacity={0.1} strokeWidth={2} name="Device Status" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartContainer title="WiFi Connection Status" chartId="wifi-status">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={generateContinuousData(userMeasurements, "wifi_connected", "wifi-status").map((m) => ({
                        ...m,
                        connected: m.value ? 1 : 0,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <YAxis type="number" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => (value === 1 ? "On" : "Off")} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                        formatter={(value: any) => [value === 1 ? "On" : "Off", "Status"]}
                      />
                      <Legend />
                      <Area type="stepAfter" dataKey="connected" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.1} strokeWidth={2} name="WiFi Status" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartContainer title="Battery Level" chartId="battery-level">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={generateContinuousData(userMeasurements, "low_battery", "battery-level").map((m) => ({
                        ...m,
                        battery: m.value,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
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
                      <Area type="monotone" dataKey="battery" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.1} strokeWidth={2} name="Battery Level (%)" />
                    </AreaChart>
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
                        const merged = [...buttonPress, ...notificationPress].sort((a, b) => a.timestamp - b.timestamp);
                        return merged.map((m) => ({
                          timestamp: formatHour(m.timestamp),
                          rawTimestamp: m.timestamp,
                          buttonPress: m.type === "button_press" ? 1 : 0,
                          notificationPress: m.type === "notification_button_press" ? 1 : 0,
                        }));
                      })()}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
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

          <Dialog open={!!expandedChart} onClose={() => setExpandedChart(null)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
              {expandedChart === "device-status" && "Device Status History"}
              {expandedChart === "wifi-status" && "WiFi Connection History"}
              {expandedChart === "battery-level" && "Battery Level History"}
              {expandedChart === "button-press" && "Button Press History"}
              <IconButton onClick={() => setExpandedChart(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <Box sx={{ mb: 2, mt: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <DatePicker
                        label="Fecha de inicio"
                        value={expandedChart ? chartDateRanges[expandedChart].startDate : undefined}
                        onChange={(newValue) => expandedChart && newValue && handleDateRangeChange(expandedChart, "startDate", newValue)}
                        maxDate={expandedChart ? chartDateRanges[expandedChart].endDate : undefined}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <DatePicker
                        label="Fecha de fin"
                        value={expandedChart ? chartDateRanges[expandedChart].endDate : undefined}
                        onChange={(newValue) => expandedChart && newValue && handleDateRangeChange(expandedChart, "endDate", newValue)}
                        minDate={expandedChart ? chartDateRanges[expandedChart].startDate : undefined}
                        maxDate={new Date()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </LocalizationProvider>
              <Box sx={{ height: "70vh", width: "100%" }}>
                {expandedChart === "device-status" && (
                  <ResponsiveContainer>
                    <AreaChart
                      data={generateContinuousData(userMeasurements, "off_body", expandedChart).map((m) => ({
                        ...m,
                        status: m.value ? 0 : 1,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <YAxis type="number" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => (value === 1 ? "On" : "Off")} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                        formatter={(value: any) => [value === 1 ? "On" : "Off", "Status"]}
                      />
                      <Legend />
                      <Area type="stepAfter" dataKey="status" stroke="#1976d2" fill="#1976d2" fillOpacity={0.1} strokeWidth={2} name="Device Status" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {expandedChart === "wifi-status" && (
                  <ResponsiveContainer>
                    <AreaChart
                      data={generateContinuousData(userMeasurements, "wifi_connected", expandedChart).map((m) => ({
                        ...m,
                        connected: m.value ? 1 : 0,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <YAxis type="number" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => (value === 1 ? "On" : "Off")} />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return formatMonthDayHour(payload[0].payload.rawTimestamp);
                          }
                          return "";
                        }}
                        formatter={(value: any) => [value === 1 ? "On" : "Off", "Status"]}
                      />
                      <Legend />
                      <Area type="stepAfter" dataKey="connected" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.1} strokeWidth={2} name="WiFi Status" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {expandedChart === "battery-level" && (
                  <ResponsiveContainer>
                    <AreaChart
                      data={generateContinuousData(userMeasurements, "low_battery", expandedChart).map((m) => ({
                        ...m,
                        battery: m.value,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
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
                      <Area type="monotone" dataKey="battery" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.1} strokeWidth={2} name="Battery Level (%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {expandedChart === "button-press" && (
                  <ResponsiveContainer>
                    <BarChart
                      data={userMeasurements
                        .filter((m) => m.type === "button_press" || m.type === "notification_button_press")
                        .filter((m) => {
                          const { startDate, endDate } = chartDateRanges[expandedChart];
                          const timestamp = m.timestamp;
                          return timestamp >= startOfDay(startDate).getTime() && timestamp <= endOfDay(endDate).getTime();
                        })
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map((m) => ({
                          timestamp: formatHour(m.timestamp),
                          rawTimestamp: m.timestamp,
                          buttonPress: m.type === "button_press" ? 1 : 0,
                          notificationPress: m.type === "notification_button_press" ? 1 : 0,
                        }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        height={60}
                        tick={({ x, y, payload }) => {
                          const [time, date] = payload.value.split("\n");
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text x={0} y={0} dy={12} textAnchor="middle" fill="#666">
                                {time}
                              </text>
                              <text x={0} y={0} dy={28} textAnchor="middle" fill="#666">
                                {date}
                              </text>
                            </g>
                          );
                        }}
                      />
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
