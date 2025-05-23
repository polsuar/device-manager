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
import { collection, getDocs, doc, query, where } from "firebase/firestore";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
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
  const [userMeasurementsRaw, setUserMeasurementsRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"events" | "logs" | "measurements">("events");
  const [chartDateRanges, setChartDateRanges] = useState<Record<string, ChartDateRange>>({});
  const [measurementsDateRange, setMeasurementsDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);

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
      "network-types": { ...defaultRange },
      "measurements-battery": { ...defaultRange },
      "measurements-plugged": { ...defaultRange },
      "measurements-errors": { ...defaultRange },
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
      const networkLogs = await networkLogService.getNetworkLogs(userId, undefined, 1000);

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

  const handleViewUserMeasurements = async (userId: string, customRange?: { startDate: Date; endDate: Date }) => {
    setSelectedUser({
      userId,
      networkLogs: [],
      measurements: [],
    });
    setViewMode("measurements");
    setLoading(true);
    try {
      const { db } = getFirebase();
      // Usar el rango de fechas seleccionado o el default
      const range = customRange ||
        measurementsDateRange || {
          startDate: subDays(new Date(), 1),
          endDate: new Date(),
        };
      setMeasurementsDateRange(range);
      const startTimestamp = String(range.startDate.getTime());
      const endTimestamp = String(range.endDate.getTime());
      const measurementsRef = collection(doc(db, "users", userId), "MEASUREMENTS");
      const q = query(measurementsRef, where("__name__", ">=", startTimestamp), where("__name__", "<=", endTimestamp));
      const measurementsSnapshot = await getDocs(q);
      const measurements = measurementsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const id = doc.id;
        return { id, ...data };
      });
      setUserMeasurementsRaw(measurements);
      setUserStats({
        userId,
        email: users.find((u) => u.userId === userId)?.email || "Unknown",
        totalDevices: 0,
        activeDevices: 0,
        averageBattery: 0,
        averageHeartRate: 0,
        devicesWithLocation: 0,
        lastActivity: 0,
        networkStats: undefined,
      });
    } catch (error) {
      console.error("Error fetching user measurements:", error);
      setError("Error al cargar las mediciones del usuario. Por favor, intente nuevamente.");
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

  const normalizeLogTimestamp = (log: any) => {
    if (typeof log.timestamp === "string") {
      const date = new Date(log.timestamp);
      if (!isNaN(date.getTime())) {
        return {
          ...log,
          timestamp: {
            seconds: Math.floor(date.getTime() / 1000),
            nanoseconds: 0,
          },
        };
      }
    }
    return log;
  };

  const getChartData = (chartId: string) => {
    if (!selectedUser?.networkLogs) return [];

    const range = getDateRange(chartId);
    const startTime = range.startDate.getTime();
    const endTime = range.endDate.getTime();

    return selectedUser.networkLogs
      .map(normalizeLogTimestamp)
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
        networkType: log.networkType || "Unknown",
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
                      <Button variant="outlined" size="small" color="info" sx={{ mr: 1 }} onClick={() => handleViewUserMeasurements(user.userId)}>
                        Mediciones
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
              {viewMode === "events" ? "User Details" : viewMode === "logs" ? "Network Logs" : "Mediciones"}: {userStats.userId}
            </Typography>
            <IconButton
              onClick={() => {
                setSelectedUser(null);
                setUserStats(null);
                setUserMeasurements([]);
                setUserMeasurementsRaw([]);
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
          ) : viewMode === "logs" ? (
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
                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de inicio"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-types"]?.startDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-types", "startDate", newValue)}
                                maxDate={chartDateRanges["network-types"]?.endDate || new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                              <DatePicker
                                label="Fecha de fin"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-types"]?.endDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-types", "endDate", newValue)}
                                minDate={chartDateRanges["network-types"]?.startDate}
                                maxDate={new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </Box>
                          <ChartContainer title="Network Types Distribution" chartId="network-types" onExpand={setExpandedChart}>
                            {(() => {
                              const filteredLogs = getChartData("network-types");
                              const networkTypesData = Array.from(
                                filteredLogs.reduce((acc, log) => {
                                  const type = log.networkType || "Unknown";
                                  acc.set(type, (acc.get(type) || 0) + 1);
                                  return acc;
                                }, new Map())
                              ).map(([type, count]) => ({ name: type, value: count }));
                              const pieColors = [
                                "#1976d2", // azul
                                "#2e7d32", // verde
                                "#ed6c02", // naranja
                                "#d32f2f", // rojo
                                "#9c27b0", // violeta
                                "#00838f", // cyan
                                "#fbc02d", // amarillo
                                "#6d4c41", // marrón
                                "#c2185b", // rosa
                                "#7b1fa2", // púrpura
                              ];
                              const types = Array.from(new Set(filteredLogs.map((log) => log.networkType || "Unknown")));
                              return (
                                <Box sx={{ display: "flex", gap: 2 }}>
                                  <Box sx={{ flex: 1, minWidth: 0, height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={networkTypesData}
                                          dataKey="value"
                                          nameKey="name"
                                          cx="50%"
                                          cy="50%"
                                          outerRadius={80}
                                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                          {networkTypesData.map((entry, index) => (
                                            <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                                          ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`${value} conexiones`, "Cantidad"]} />
                                        <Legend />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0, height: 300, display: "flex", alignItems: "center" }}>
                                    <ResponsiveContainer width="100%" height={150}>
                                      <AreaChart
                                        data={filteredLogs.map((log) => {
                                          const entry: any = { timestamp: log.timestamp };
                                          types.forEach((type) => {
                                            entry[type] = log.networkType === type ? 1 : 0;
                                          });
                                          return entry;
                                        })}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), "dd/MM HH:mm")} tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} domain={[0, 1]} />
                                        <Tooltip labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy HH:mm:ss")} />
                                        {types.map((type, idx) => (
                                          <Area
                                            key={type}
                                            type="stepAfter"
                                            dataKey={type}
                                            stackId="1"
                                            stroke={pieColors[idx % pieColors.length]}
                                            fill={pieColors[idx % pieColors.length]}
                                          />
                                        ))}
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </Box>
                                </Box>
                              );
                            })()}
                          </ChartContainer>
                          <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                            <b>Rango:</b> {chartDateRanges["network-types"]?.startDate?.toLocaleString()} -{" "}
                            {chartDateRanges["network-types"]?.endDate?.toLocaleString()}
                            <br />
                            <b>Logs en rango:</b> {getChartData("network-types").length}
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de inicio"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-speed"]?.startDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-speed", "startDate", newValue)}
                                maxDate={chartDateRanges["network-speed"]?.endDate || new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                              <DatePicker
                                label="Fecha de fin"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-speed"]?.endDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-speed", "endDate", newValue)}
                                minDate={chartDateRanges["network-speed"]?.startDate}
                                maxDate={new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </Box>
                          <ChartContainer title="Network Speed Metrics" chartId="network-speed" onExpand={setExpandedChart}>
                            <NetworkSpeedChart
                              key={`${chartDateRanges["network-speed"]?.startDate?.getTime() || ""}-${
                                chartDateRanges["network-speed"]?.endDate?.getTime() || ""
                              }`}
                              data={getChartData("network-speed")}
                            />
                          </ChartContainer>
                          <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                            <b>Rango:</b>{" "}
                            {chartDateRanges["network-speed"]?.startDate ? format(chartDateRanges["network-speed"].startDate, "dd/MM/yyyy HH:mm:ss") : ""} -{" "}
                            {chartDateRanges["network-speed"]?.endDate ? format(chartDateRanges["network-speed"].endDate, "dd/MM/yyyy HH:mm:ss") : ""}
                            <br />
                            <b>Logs en rango:</b> {getChartData("network-speed").length}
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de inicio"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-signal"]?.startDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-signal", "startDate", newValue)}
                                maxDate={chartDateRanges["network-signal"]?.endDate || new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                              <DatePicker
                                label="Fecha de fin"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-signal"]?.endDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-signal", "endDate", newValue)}
                                minDate={chartDateRanges["network-signal"]?.startDate}
                                maxDate={new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </Box>
                          <ChartContainer title="Signal Quality" chartId="network-signal" onExpand={setExpandedChart}>
                            <NetworkSignalChart
                              key={`${chartDateRanges["network-signal"]?.startDate?.getTime() || ""}-${
                                chartDateRanges["network-signal"]?.endDate?.getTime() || ""
                              }`}
                              data={getChartData("network-signal")}
                            />
                          </ChartContainer>
                          <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                            <b>Rango:</b> {chartDateRanges["network-signal"]?.startDate?.toLocaleString()} -{" "}
                            {chartDateRanges["network-signal"]?.endDate?.toLocaleString()}
                            <br />
                            <b>Logs en rango:</b> {getChartData("network-signal").length}
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de inicio"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-data"]?.startDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-data", "startDate", newValue)}
                                maxDate={chartDateRanges["network-data"]?.endDate || new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                              <DatePicker
                                label="Fecha de fin"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-data"]?.endDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-data", "endDate", newValue)}
                                minDate={chartDateRanges["network-data"]?.startDate}
                                maxDate={new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </Box>
                          <ChartContainer title="Data Usage Over Time" chartId="network-data" onExpand={setExpandedChart}>
                            <NetworkDataChart
                              key={`${chartDateRanges["network-data"]?.startDate?.getTime() || ""}-${
                                chartDateRanges["network-data"]?.endDate?.getTime() || ""
                              }`}
                              data={getChartData("network-data")}
                            />
                          </ChartContainer>
                          <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                            <b>Rango:</b> {chartDateRanges["network-data"]?.startDate?.toLocaleString()} -{" "}
                            {chartDateRanges["network-data"]?.endDate?.toLocaleString()}
                            <br />
                            <b>Logs en rango:</b> {getChartData("network-data").length}
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de inicio"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-quality"]?.startDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-quality", "startDate", newValue)}
                                maxDate={chartDateRanges["network-quality"]?.endDate || new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                              <DatePicker
                                label="Fecha de fin"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-quality"]?.endDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-quality", "endDate", newValue)}
                                minDate={chartDateRanges["network-quality"]?.startDate}
                                maxDate={new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </Box>
                          <ChartContainer title="Network Quality" chartId="network-quality" onExpand={setExpandedChart}>
                            <NetworkQualityChart
                              key={`${chartDateRanges["network-quality"]?.startDate?.getTime() || ""}-${
                                chartDateRanges["network-quality"]?.endDate?.getTime() || ""
                              }`}
                              data={getChartData("network-quality")}
                            />
                          </ChartContainer>
                          <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                            <b>Rango:</b> {chartDateRanges["network-quality"]?.startDate?.toLocaleString()} -{" "}
                            {chartDateRanges["network-quality"]?.endDate?.toLocaleString()}
                            <br />
                            <b>Logs en rango:</b> {getChartData("network-quality").length}
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de inicio"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-battery"]?.startDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-battery", "startDate", newValue)}
                                maxDate={chartDateRanges["network-battery"]?.endDate || new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                              <DatePicker
                                label="Fecha de fin"
                                format="dd/MM/yyyy"
                                value={chartDateRanges["network-battery"]?.endDate || null}
                                onChange={(newValue) => handleDateRangeChange("network-battery", "endDate", newValue)}
                                minDate={chartDateRanges["network-battery"]?.startDate}
                                maxDate={new Date()}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </LocalizationProvider>
                          </Box>
                          <ChartContainer title="Charging Status Over Time" chartId="network-battery" onExpand={setExpandedChart}>
                            <ResponsiveContainer width="100%" height={300}>
                              <AreaChart
                                data={getChartData("network-battery").map((d) => ({
                                  timestamp: d.timestamp,
                                  isCharging: d.isCharging ? 1 : 0,
                                }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), "dd/MM HH:mm")} tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} domain={[0, 1]} />
                                <Tooltip
                                  labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy HH:mm:ss")}
                                  formatter={(v) => (v === 1 ? "Charging" : "Not Charging")}
                                />
                                <Area type="stepAfter" dataKey="isCharging" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                          <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                            <b>Rango:</b> {chartDateRanges["network-battery"]?.startDate?.toLocaleString()} -{" "}
                            {chartDateRanges["network-battery"]?.endDate?.toLocaleString()}
                            <br />
                            <b>Logs en rango:</b> {getChartData("network-battery").length}
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </>
          ) : viewMode === "measurements" ? (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                        <DatePicker
                          label="Fecha de inicio"
                          format="dd/MM/yyyy"
                          value={chartDateRanges["measurements-battery"]?.startDate || null}
                          onChange={(newValue) => {
                            handleDateRangeChange("measurements-battery", "startDate", newValue);
                            if (selectedUser) {
                              handleViewUserMeasurements(selectedUser.userId, {
                                startDate: newValue || chartDateRanges["measurements-battery"].startDate,
                                endDate: chartDateRanges["measurements-battery"].endDate,
                              });
                            }
                          }}
                          maxDate={chartDateRanges["measurements-battery"]?.endDate || new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                        <DatePicker
                          label="Fecha de fin"
                          format="dd/MM/yyyy"
                          value={chartDateRanges["measurements-battery"]?.endDate || null}
                          onChange={(newValue) => {
                            handleDateRangeChange("measurements-battery", "endDate", newValue);
                            if (selectedUser) {
                              handleViewUserMeasurements(selectedUser.userId, {
                                startDate: chartDateRanges["measurements-battery"].startDate,
                                endDate: newValue || chartDateRanges["measurements-battery"].endDate,
                              });
                            }
                          }}
                          minDate={chartDateRanges["measurements-battery"]?.startDate}
                          maxDate={new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Box>
                    <ChartContainer title="Battery Level Over Time" chartId="measurements-battery" onExpand={setExpandedChart}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={(() => {
                            // Filtrar, mapear y ordenar (sin deduplicar)
                            return userMeasurementsRaw
                              .filter((m) => {
                                const t = Number(m.id);
                                const range = getDateRange("measurements-battery");
                                const keys = Object.keys(m).filter((k) => k !== "id");
                                let mainKey = keys.find((k) => k.includes("battery.Success")) || keys[0];
                                let data = m[mainKey] || {};
                                return t >= range.startDate.getTime() && t <= range.endDate.getTime() && typeof data.battery_level === "number";
                              })
                              .map((m) => {
                                const keys = Object.keys(m).filter((k) => k !== "id");
                                let mainKey = keys.find((k) => k.includes("battery.Success")) || keys[0];
                                let data = m[mainKey] || {};
                                return {
                                  timestamp: Number(m.id),
                                  battery_level: data.battery_level,
                                };
                              })
                              .sort((a, b) => a.timestamp - b.timestamp);
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), "dd/MM HH:mm")} tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy HH:mm:ss")} />
                          <Legend />
                          <Area type="monotone" dataKey="battery_level" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.1} name="Battery Level" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                      <b>Rango:</b> {chartDateRanges["measurements-battery"]?.startDate?.toLocaleString()} -{" "}
                      {chartDateRanges["measurements-battery"]?.endDate?.toLocaleString()}
                      <br />
                      <b>Mediciones en rango:</b>{" "}
                      {
                        userMeasurementsRaw.filter((m) => {
                          const t = Number(m.id);
                          const range = getDateRange("measurements-battery");
                          return t >= range.startDate.getTime() && t <= range.endDate.getTime();
                        }).length
                      }
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                        <DatePicker
                          label="Fecha de inicio"
                          format="dd/MM/yyyy"
                          value={chartDateRanges["measurements-plugged"]?.startDate || null}
                          onChange={(newValue) => handleDateRangeChange("measurements-plugged", "startDate", newValue)}
                          maxDate={chartDateRanges["measurements-plugged"]?.endDate || new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                        <DatePicker
                          label="Fecha de fin"
                          format="dd/MM/yyyy"
                          value={chartDateRanges["measurements-plugged"]?.endDate || null}
                          onChange={(newValue) => handleDateRangeChange("measurements-plugged", "endDate", newValue)}
                          minDate={chartDateRanges["measurements-plugged"]?.startDate}
                          maxDate={new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Box>
                    <ChartContainer title="Plugged Status Over Time" chartId="measurements-plugged" onExpand={setExpandedChart}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={userMeasurementsRaw
                            .filter((m) => {
                              const t = Number(m.id);
                              const range = getDateRange("measurements-plugged");
                              return t >= range.startDate.getTime() && t <= range.endDate.getTime();
                            })
                            .map((m) => {
                              const keys = Object.keys(m).filter((k) => k !== "id");
                              let mainKey = keys.find((k) => k.includes("battery.Success")) || keys[0];
                              let data = m[mainKey] || {};
                              return {
                                timestamp: Number(m.id),
                                plugged: data.battery_plugged === true ? 1 : 0,
                              };
                            })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), "dd/MM HH:mm")} tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? "Sí" : "No")} />
                          <Tooltip labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy HH:mm:ss")} />
                          <Legend />
                          <Area type="stepAfter" dataKey="plugged" stroke="#1976d2" fill="#1976d2" fillOpacity={0.1} name="Plugged" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                      <b>Rango:</b> {chartDateRanges["measurements-plugged"]?.startDate?.toLocaleString()} -{" "}
                      {chartDateRanges["measurements-plugged"]?.endDate?.toLocaleString()}
                      <br />
                      <b>Mediciones en rango:</b>{" "}
                      {
                        userMeasurementsRaw.filter((m) => {
                          const t = Number(m.id);
                          const range = getDateRange("measurements-plugged");
                          return t >= range.startDate.getTime() && t <= range.endDate.getTime();
                        }).length
                      }
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                        <DatePicker
                          label="Fecha de inicio"
                          format="dd/MM/yyyy"
                          value={chartDateRanges["measurements-errors"]?.startDate || null}
                          onChange={(newValue) => handleDateRangeChange("measurements-errors", "startDate", newValue)}
                          maxDate={chartDateRanges["measurements-errors"]?.endDate || new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                        <DatePicker
                          label="Fecha de fin"
                          format="dd/MM/yyyy"
                          value={chartDateRanges["measurements-errors"]?.endDate || null}
                          onChange={(newValue) => handleDateRangeChange("measurements-errors", "endDate", newValue)}
                          minDate={chartDateRanges["measurements-errors"]?.startDate}
                          maxDate={new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Box>
                    <ChartContainer title="Errores por Timestamp" chartId="measurements-errors" onExpand={setExpandedChart}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={userMeasurementsRaw
                            .filter((m) => {
                              const t = Number(m.id);
                              const range = getDateRange("measurements-errors");
                              return t >= range.startDate.getTime() && t <= range.endDate.getTime();
                            })
                            .map((m) => {
                              const keys = Object.keys(m).filter((k) => k !== "id");
                              const errorKeys = keys.filter((k) => k.includes("Error"));
                              return {
                                timestamp: Number(m.id),
                                errors: errorKeys.length,
                              };
                            })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), "dd/MM HH:mm")} tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy HH:mm:ss")} />
                          <Legend />
                          <Area type="monotone" dataKey="errors" stroke="#d32f2f" fill="#d32f2f" fillOpacity={0.1} name="Errores" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <Box sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                      <b>Rango:</b> {chartDateRanges["measurements-errors"]?.startDate?.toLocaleString()} -{" "}
                      {chartDateRanges["measurements-errors"]?.endDate?.toLocaleString()}
                      <br />
                      <b>Mediciones en rango:</b>{" "}
                      {
                        userMeasurementsRaw.filter((m) => {
                          const t = Number(m.id);
                          const range = getDateRange("measurements-errors");
                          return t >= range.startDate.getTime() && t <= range.endDate.getTime();
                        }).length
                      }
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : null}

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
                        format="dd/MM/yyyy"
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
                        format="dd/MM/yyyy"
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
