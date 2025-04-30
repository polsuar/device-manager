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
import { ArrowBack as ArrowBackIcon, Close as CloseIcon } from "@mui/icons-material";
import { collection, getDocs, doc } from "firebase/firestore";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { networkLogService } from "../services/networkLogService";

import { ChartContainer } from "../components/users/ChartContainer";
import { DeviceStats, NetworkStats } from "../components/users/StatCards";
import { NetworkSpeedChart, NetworkSignalChart, NetworkDataChart, NetworkQualityChart, NetworkBatteryChart } from "../components/users/NetworkCharts";
import { DeviceStatusChart, WifiStatusChart, BatteryLevelChart, ButtonPressChart } from "../components/users/EventCharts";
import { formatMonthDayHour } from "../components/users/utils";
import { UserStats, UserBasic, SelectedUser, ChartDateRange, Measurement } from "../components/users/types";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Users() {
  const { user } = useAuth();
  const { getFirebase } = useEnvironment();
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserBasic[]>([]);
  const [searchId, setSearchId] = useState("");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userMeasurements, setUserMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"events" | "logs">("events");
  const [chartDateRanges, setChartDateRanges] = useState<Record<string, ChartDateRange>>({});

  const initializeDateRanges = () => {
    const now = new Date();
    const yesterday = subDays(now, 1);
    const defaultRange = {
      startDate: startOfDay(yesterday),
      endDate: endOfDay(now),
    };

    setChartDateRanges({
      "device-status": { ...defaultRange },
      "wifi-status": { ...defaultRange },
      "battery-level": { ...defaultRange },
      "button-press": { ...defaultRange },
      "network-speed": { ...defaultRange },
      "network-signal": { ...defaultRange },
      "network-data": { ...defaultRange },
      "network-quality": { ...defaultRange },
      "network-battery": { ...defaultRange },
    });
  };

  useEffect(() => {
    initializeDateRanges();
  }, []);

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
    setSelectedUser({
      userId,
      networkLogs: [],
      measurements: [],
    });
    setViewMode("events");
    setLoading(true);
    try {
      const { db } = getFirebase();
      const [eventsSnapshot, networkLogsSnapshot] = await Promise.all([
        getDocs(collection(doc(db, "users", userId), "EVENTS")),
        getDocs(collection(doc(db, "users", userId), "NETWORK_LOGS")),
      ]);

      const measurements = eventsSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const eventKey = Object.keys(data)[0];
          const eventData = data[eventKey];

          return {
            timestamp: parseInt(doc.id),
            type: eventKey.split(".")[0],
            value: eventData.value,
            measurements: eventData.measurements || {},
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      const networkLogs = networkLogsSnapshot.docs
        .map((doc) => ({
          ...doc.data(),
        }))
        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

      setUserMeasurements(measurements);

      const wifiEvents = measurements.filter((m) => m.type === "wifi_connected");
      const batteryEvents = measurements.filter((m) => m.type === "low_battery");

      // Calculate network statistics
      const networkStats =
        networkLogs.length > 0
          ? {
              avgDownloadSpeed: networkLogs.reduce((acc, log) => acc + (log.linkSpeed > 0 ? log.linkSpeed : 0), 0) / networkLogs.length,
              avgSignalStrength: networkLogs.reduce((acc, log) => acc + log.signalStrength, 0) / networkLogs.length,
              totalRxBytes: networkLogs.reduce((acc, log) => acc + log.data_usage.rx_bytes, 0),
              totalTxBytes: networkLogs.reduce((acc, log) => acc + log.data_usage.tx_bytes, 0),
              avgPing: networkLogs.reduce((acc, log) => acc + log.ping, 0) / networkLogs.length,
              networkTypes: Array.from(new Set(networkLogs.map((log) => log.networkType))).map((type) => ({
                type,
                count: networkLogs.filter((log) => log.networkType === type).length,
              })),
            }
          : undefined;

      setUserStats({
        userId,
        email: users.find((u) => u.userId === userId)?.email || "Unknown",
        totalDevices: 1,
        activeDevices: wifiEvents.filter((e) => e.value).length > 0 ? 1 : 0,
        averageBattery: batteryEvents.length > 0 ? batteryEvents.reduce((acc, curr) => acc + curr.value, 0) / batteryEvents.length : 0,
        averageHeartRate: 0,
        devicesWithLocation: measurements.filter((m) => m.measurements?.location?.lat !== 0).length,
        lastActivity: measurements.length > 0 ? Math.max(...measurements.map((m) => m.timestamp)) : 0,
        networkStats,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("Error al cargar los detalles del usuario. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserLogs = async (userId: string) => {
    try {
      setLoading(true);
      const networkLogs = await networkLogService.getNetworkLogs(userId);

      setSelectedUser({
        userId,
        networkLogs,
        measurements: [],
      });

      const networkStats =
        networkLogs.length > 0
          ? {
              avgDownloadSpeed: networkLogs.reduce((acc, log) => acc + (log.linkSpeed > 0 ? log.linkSpeed : 0), 0) / networkLogs.length,
              avgSignalStrength: networkLogs.reduce((acc, log) => acc + log.signalStrength, 0) / networkLogs.length,
              totalRxBytes: networkLogs.reduce((acc, log) => acc + log.data_usage.rx_bytes, 0),
              totalTxBytes: networkLogs.reduce((acc, log) => acc + log.data_usage.tx_bytes, 0),
              avgPing: networkLogs.reduce((acc, log) => acc + log.ping, 0) / networkLogs.length,
              networkTypes: Array.from(new Set(networkLogs.map((log) => log.networkType))).map((type) => ({
                type,
                count: networkLogs.filter((log) => log.networkType === type).length,
              })),
            }
          : undefined;

      setUserStats({
        userId,
        email: users.find((u) => u.userId === userId)?.email || "Unknown",
        totalDevices: 0,
        activeDevices: 0,
        averageBattery: 0,
        averageHeartRate: 0,
        devicesWithLocation: 0,
        lastActivity: 0,
        networkStats,
      });

      setViewMode("logs");
    } catch (error) {
      console.error("Error fetching user logs:", error);
      setError("Error al cargar los logs del usuario. Por favor, intente nuevamente.");
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

  const handleDateRangeChange = (chartId: string, field: "startDate" | "endDate", value: Date | null) => {
    if (!value) return;

    setChartDateRanges((prev) => {
      const range = prev[chartId] || getDateRange(chartId);

      if (field === "startDate") {
        return {
          ...prev,
          [chartId]: {
            ...range,
            startDate: startOfDay(value),
          },
        };
      } else {
        return {
          ...prev,
          [chartId]: {
            ...range,
            endDate: endOfDay(value),
          },
        };
      }
    });
  };

  const getDateRange = (chartId: string) => {
    const now = new Date();
    const yesterday = subDays(now, 1);
    const defaultRange = {
      startDate: startOfDay(yesterday),
      endDate: endOfDay(now),
    };

    return chartDateRanges[chartId] || defaultRange;
  };

  const getFilteredMeasurements = (measurements: Measurement[], chartId: string) => {
    const dateRange = getDateRange(chartId);
    return measurements
      .filter((m) => {
        return m.timestamp >= dateRange.startDate.getTime() && m.timestamp <= dateRange.endDate.getTime();
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const getChartData = (chartId: string) => {
    if (!selectedUser?.networkLogs) return [];

    const range = getDateRange(chartId);
    const startTime = range.startDate.getTime();
    const endTime = range.endDate.getTime();

    return selectedUser.networkLogs
      .filter((log) => {
        const logTime = log.timestamp.seconds * 1000;
        return logTime >= startTime && logTime <= endTime;
      })
      .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
      .map((log) => ({
        timestamp: log.timestamp.seconds * 1000,
        downloadSpeed: log.downloadSpeed || 0,
        signalStrength: log.signalStrength || 0,
        data_usage: {
          rx_bytes: log.data_usage?.rx_bytes || 0,
          tx_bytes: log.data_usage?.tx_bytes || 0,
        },
        ping: log.ping || 0,
        jitter: log.jitter || 0,
        snr: log.snr || 0,
        linkSpeed: log.linkSpeed || 0,
        batteryUsage: parseFloat(log.batteryUsage?.replace(" µWh", "") || "0"),
        isCharging: log.isCharging || false,
      }));
  };

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
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => {
                          setViewMode("events");
                          handleViewUserDetails(user.userId);
                        }}
                      >
                        Eventos
                      </Button>
                      <Button variant="outlined" size="small" color="warning" onClick={() => handleViewUserLogs(user.userId)}>
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
            <Typography variant="h5">
              {viewMode === "events" ? "User Details" : "Network Logs"}: {userStats.userId}
            </Typography>
            <IconButton
              onClick={() => {
                setSelectedUser(null);
                setUserStats(null);
                setUserMeasurements([]);
                setViewMode("events");
                initializeDateRanges();
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {viewMode === "events" ? (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 3 }}>
                    <DeviceStats
                      totalDevices={userStats.totalDevices}
                      activeDevices={userStats.activeDevices}
                      averageBattery={userStats.averageBattery}
                      averageHeartRate={userStats.averageHeartRate}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <ChartContainer title="Device Status (On/Off Body)" chartId="device-status" onExpand={setExpandedChart}>
                      <DeviceStatusChart data={getFilteredMeasurements(userMeasurements, "device-status")} chartId="device-status" />
                    </ChartContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <ChartContainer title="WiFi Connection Status" chartId="wifi-status" onExpand={setExpandedChart}>
                      <WifiStatusChart data={getFilteredMeasurements(userMeasurements, "wifi-status")} chartId="wifi-status" />
                    </ChartContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <ChartContainer title="Battery Level" chartId="battery-level" onExpand={setExpandedChart}>
                      <BatteryLevelChart data={getFilteredMeasurements(userMeasurements, "battery-level")} chartId="battery-level" />
                    </ChartContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <ChartContainer title="Button Press Events" chartId="button-press" onExpand={setExpandedChart}>
                      <ButtonPressChart data={getFilteredMeasurements(userMeasurements, "button-press")} chartId="button-press" />
                    </ChartContainer>
                  </Grid>
                </Grid>
              </Box>
            </>
          ) : (
            <>
              {userStats.networkStats && (
                <>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", gap: 3 }}>
                        <NetworkStats
                          avgDownloadSpeed={userStats.networkStats.avgDownloadSpeed}
                          avgSignalStrength={userStats.networkStats.avgSignalStrength}
                          totalRxBytes={userStats.networkStats.totalRxBytes}
                          totalTxBytes={userStats.networkStats.totalTxBytes}
                          avgPing={userStats.networkStats.avgPing}
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Network Types Distribution
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={userStats.networkStats.networkTypes.map(({ type, count }) => ({
                                  name: type,
                                  value: count,
                                }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {userStats.networkStats.networkTypes.map(({ type }, index) => {
                                  const colors = {
                                    WIFI: "#1976d2",
                                    LTE: "#2e7d32",
                                    "3G": "#ed6c02",
                                    "2G": "#d32f2f",
                                  };
                                  return <Cell key={type} fill={colors[type as keyof typeof colors] || "#9c27b0"} />;
                                })}
                              </Pie>
                              <Tooltip formatter={(value: number) => [`${value} connections`, "Count"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Network Speed Metrics" chartId="network-speed" onExpand={setExpandedChart}>
                          <NetworkSpeedChart data={getChartData("network-speed")} />
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Signal Quality" chartId="network-signal" onExpand={setExpandedChart}>
                          <NetworkSignalChart data={getChartData("network-signal")} />
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Data Usage Over Time" chartId="network-data" onExpand={setExpandedChart}>
                          <NetworkDataChart data={getChartData("network-data")} />
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Network Quality" chartId="network-quality" onExpand={setExpandedChart}>
                          <NetworkQualityChart data={getChartData("network-quality")} />
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Battery Status" chartId="network-battery" onExpand={setExpandedChart}>
                          <NetworkBatteryChart data={getChartData("network-battery")} />
                        </ChartContainer>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </>
          )}

          <Dialog open={!!expandedChart} onClose={() => setExpandedChart(null)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {expandedChart === "device-status" && "Device Status History"}
              {expandedChart === "wifi-status" && "WiFi Status History"}
              {expandedChart === "battery-level" && "Battery Level History"}
              {expandedChart === "button-press" && "Button Press History"}
              {expandedChart === "network-speed" && "Network Speed History"}
              {expandedChart === "network-signal" && "Network Signal History"}
              {expandedChart === "network-data" && "Data Usage History"}
              {expandedChart === "network-quality" && "Network Quality History"}
              {expandedChart === "network-battery" && "Network Battery History"}
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
                        value={expandedChart ? chartDateRanges[expandedChart]?.startDate || null : null}
                        onChange={(newValue) => expandedChart && handleDateRangeChange(expandedChart, "startDate", newValue)}
                        maxDate={expandedChart ? chartDateRanges[expandedChart]?.endDate || new Date() : new Date()}
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
                        value={expandedChart ? chartDateRanges[expandedChart]?.endDate || null : null}
                        onChange={(newValue) => expandedChart && handleDateRangeChange(expandedChart, "endDate", newValue)}
                        minDate={expandedChart ? chartDateRanges[expandedChart]?.startDate : undefined}
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
                <Box sx={{ height: "calc(100vh - 300px)" }}>
                  {expandedChart === "device-status" && (
                    <DeviceStatusChart data={getFilteredMeasurements(userMeasurements, expandedChart)} chartId={expandedChart} />
                  )}
                  {expandedChart === "wifi-status" && (
                    <WifiStatusChart data={getFilteredMeasurements(userMeasurements, expandedChart)} chartId={expandedChart} />
                  )}
                  {expandedChart === "battery-level" && (
                    <BatteryLevelChart data={getFilteredMeasurements(userMeasurements, expandedChart)} chartId={expandedChart} />
                  )}
                  {expandedChart === "button-press" && (
                    <ButtonPressChart data={getFilteredMeasurements(userMeasurements, expandedChart)} chartId={expandedChart} />
                  )}
                  {expandedChart === "network-speed" && <NetworkSpeedChart data={getChartData(expandedChart)} />}
                  {expandedChart === "network-signal" && <NetworkSignalChart data={getChartData(expandedChart)} />}
                  {expandedChart === "network-data" && <NetworkDataChart data={getChartData(expandedChart)} />}
                  {expandedChart === "network-quality" && <NetworkQualityChart data={getChartData(expandedChart)} />}
                  {expandedChart === "network-battery" && <NetworkBatteryChart data={getChartData(expandedChart)} />}
                </Box>
              </LocalizationProvider>
            </DialogContent>
          </Dialog>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3 }}>
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
