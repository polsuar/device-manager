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
  Chip,
} from "@mui/material";
import {
  DevicesOther as DevicesIcon,
  BatteryFull as BatteryIcon,
  Favorite as HeartRateIcon,
  Wifi as WifiIcon,
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
  Speed as SpeedIcon,
  SignalCellularConnectedNoInternet4Bar as SignalIcon,
  Storage as StorageIcon,
  NetworkWifi as NetworkIcon,
} from "@mui/icons-material";
import { collection, getDocs, doc } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { networkLogService } from "../services/networkLogService";

interface UserStats {
  userId: string;
  email: string;
  totalDevices: number;
  activeDevices: number;
  averageBattery: number;
  averageHeartRate: number;
  devicesWithLocation: number;
  lastActivity: number;
  networkStats?: {
    avgDownloadSpeed: number;
    avgSignalStrength: number;
    totalRxBytes: number;
    totalTxBytes: number;
    avgPing: number;
    networkTypes: { type: string; count: number }[];
  };
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
    downloadSpeed?: number;
    signalStrength?: number;
    data_usage?: {
      rx_bytes: number;
      tx_bytes: number;
    };
    ping?: number;
    jitter?: number;
    snr?: number;
    linkSpeed?: number;
    batteryUsage?: number;
    isCharging?: number;
    networkType?: string;
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

interface NetworkLog {
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  networkType: string;
  signalStrength: number;
  downloadSpeed: number;
  batteryUsage: string;
  data_usage: {
    rx_bytes: number;
    tx_bytes: number;
  };
  ping: number;
  jitter: number;
  snr: number;
  linkSpeed: number;
  isCharging: boolean;
  location?: {
    lat: number;
    long: number;
  };
}

interface NetworkLogData {
  timestamp: number;
  downloadSpeed: number;
  signalStrength: number;
  data_usage: {
    rx_bytes: number;
    tx_bytes: number;
  };
  ping: number;
  jitter: number;
  snr: number;
  linkSpeed: number;
  batteryUsage: number;
  isCharging: boolean;
}

interface ChartData {
  timestamp: number;
  value?: number;
  measurements?: {
    downloadSpeed?: number;
    signalStrength?: number;
    data_usage?: {
      rx_bytes: number;
      tx_bytes: number;
    };
    ping?: number;
    jitter?: number;
    snr?: number;
    linkSpeed?: number;
    batteryUsage?: number;
    isCharging?: number;
    networkType?: string;
  };
}

interface SelectedUser {
  userId: string;
  networkLogs: NetworkLog[];
  measurements: Measurement[];
}

const formatTimestamp = (timestamp: number): string => {
  return format(new Date(timestamp), "HH:mm:ss");
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

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
  const [chartDateRanges, setChartDateRanges] = useState<Record<string, ChartDateRange>>({
    "device-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "wifi-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "battery-level": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "button-press": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "network-speed": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "network-signal": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "network-data": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "network-quality": { startDate: subDays(new Date(), 1), endDate: new Date() },
    "network-battery": { startDate: subDays(new Date(), 1), endDate: new Date() },
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

      const networkLogs = networkLogsSnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as NetworkLog[];

      setUserMeasurements(measurements);

      const wifiEvents = measurements.filter((m) => m.type === "wifi_connected");
      const batteryEvents = measurements.filter((m) => m.type === "low_battery");
      const fallEvents = measurements.filter((m) => m.type === "probable_fall");
      const offBodyEvents = measurements.filter((m) => m.type === "off_body");

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
              avgDownloadSpeed: networkLogs.reduce((acc: number, log: NetworkLog) => acc + (log.linkSpeed > 0 ? log.linkSpeed : 0), 0) / networkLogs.length,
              avgSignalStrength: networkLogs.reduce((acc: number, log: NetworkLog) => acc + log.signalStrength, 0) / networkLogs.length,
              totalRxBytes: networkLogs.reduce((acc: number, log: NetworkLog) => acc + log.data_usage.rx_bytes, 0),
              totalTxBytes: networkLogs.reduce((acc: number, log: NetworkLog) => acc + log.data_usage.tx_bytes, 0),
              avgPing: networkLogs.reduce((acc: number, log: NetworkLog) => acc + log.ping, 0) / networkLogs.length,
              networkTypes: Array.from(new Set(networkLogs.map((log: NetworkLog) => log.networkType))).map((type) => ({
                type,
                count: networkLogs.filter((log: NetworkLog) => log.networkType === type).length,
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

  const getDateRange = (chartId: string) => {
    return chartDateRanges[chartId] || { startDate: subDays(new Date(), 1), endDate: new Date() };
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

  const getChartData = (chartId: string): NetworkLogData[] => {
    const dateRange = getDateRange(chartId);
    if (!selectedUser?.networkLogs) return [];

    // Primero filtramos y mapeamos los datos
    const mappedData = selectedUser.networkLogs
      .filter((log: NetworkLog) => {
        const timestamp = log.timestamp.seconds * 1000;
        return timestamp >= dateRange.startDate.getTime() && timestamp <= dateRange.endDate.getTime();
      })
      .map((log: NetworkLog) => ({
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

    // Luego procesamos los datos para asegurar timestamps únicos
    const uniqueData = mappedData.reduce((acc: NetworkLogData[], current) => {
      const existingIndex = acc.findIndex((item) => item.timestamp === current.timestamp);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Si encontramos un timestamp duplicado, agregamos un pequeño offset
        current.timestamp += 1;
        acc.push(current);
      }
      return acc;
    }, []);

    // Finalmente ordenamos los datos por timestamp
    return uniqueData.sort((a, b) => a.timestamp - b.timestamp);
  };

  const NetworkSpeedChart = () => {
    const data = getChartData("network-speed");
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => formatTimestamp(value)}
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip labelFormatter={(value) => formatTimestamp(value)} formatter={(value: number) => [`${value.toFixed(2)} Mbps`, "Speed"]} />
          <Legend />
          <Area
            type="monotone"
            dataKey="downloadSpeed"
            stroke="#2e7d32"
            fill="#2e7d32"
            fillOpacity={0.1}
            name="Download Speed"
            dot={false}
            key="downloadSpeed"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="linkSpeed"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.1}
            name="Link Speed"
            dot={false}
            key="linkSpeed"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const NetworkSignalChart = () => {
    const data = getChartData("network-signal");
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => formatTimestamp(value)}
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip labelFormatter={(value) => formatTimestamp(value)} formatter={(value: number) => [`${value} dBm`, "Signal"]} />
          <Legend />
          <Area
            type="monotone"
            dataKey="signalStrength"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.1}
            name="Signal Strength"
            dot={false}
            key="signalStrength"
            strokeWidth={2}
          />
          <Area type="monotone" dataKey="snr" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.1} name="SNR" dot={false} key="snr" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const NetworkDataChart = () => {
    const data = getChartData("network-data");

    // Calculate max value for Y axis domain
    const maxBytes = data.reduce((max, point) => {
      const rxBytes = point.data_usage?.rx_bytes || 0;
      const txBytes = point.data_usage?.tx_bytes || 0;
      return Math.max(max, rxBytes, txBytes);
    }, 0);

    // Round up to nearest MB and add 20% margin
    const maxMB = Math.ceil((maxBytes / (1024 * 1024)) * 1.2);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => formatTimestamp(value)}
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(value) => `${(value / (1024 * 1024)).toFixed(1)} MB`} domain={[0, maxBytes]} width={80} />
          <Tooltip labelFormatter={(value) => formatTimestamp(value)} formatter={(value: number) => [formatBytes(value), "Data"]} />
          <Legend />
          <Area
            type="monotone"
            dataKey="data_usage.rx_bytes"
            stroke="#9c27b0"
            fill="#9c27b0"
            fillOpacity={0.1}
            name="RX Data"
            dot={false}
            key="rx_bytes"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="data_usage.tx_bytes"
            stroke="#d32f2f"
            fill="#d32f2f"
            fillOpacity={0.1}
            name="TX Data"
            dot={false}
            key="tx_bytes"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const NetworkQualityChart = () => {
    const data = getChartData("network-quality");
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => formatTimestamp(value)}
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip labelFormatter={(value) => formatTimestamp(value)} formatter={(value: number) => [`${value} ms`, "Time"]} />
          <Legend />
          <Area type="monotone" dataKey="ping" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.1} name="Ping" dot={false} key="ping" strokeWidth={2} />
          <Area type="monotone" dataKey="jitter" stroke="#9c27b0" fill="#9c27b0" fillOpacity={0.1} name="Jitter" dot={false} key="jitter" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const NetworkBatteryChart = () => {
    const data = getChartData("network-battery");
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => formatTimestamp(value)}
            scale="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => formatTimestamp(value)}
            formatter={(value: any) => {
              if (typeof value === "boolean") {
                return [value ? "Yes" : "No", "Charging"];
              }
              return [`${value} µWh`, "Battery Usage"];
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="batteryUsage"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.1}
            name="Battery Usage"
            dot={false}
            key="batteryUsage"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="isCharging"
            stroke="#2e7d32"
            fill="#2e7d32"
            fillOpacity={0.1}
            name="Charging Status"
            dot={false}
            key="isCharging"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const EventChart = () => {
    const data = getChartData("events");
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
        <YAxis />
        <Tooltip labelFormatter={formatTimestamp} formatter={(value: number) => [`${value}`, "Value"]} />
        <Legend />
        <Line type="monotone" dataKey="value" name="Value" stroke="#8884d8" dot={false} />
      </LineChart>
    );
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
                setChartDateRanges({
                  "device-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "wifi-status": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "battery-level": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "button-press": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "network-speed": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "network-signal": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "network-data": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "network-quality": { startDate: subDays(new Date(), 1), endDate: new Date() },
                  "network-battery": { startDate: subDays(new Date(), 1), endDate: new Date() },
                });
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {viewMode === "events" ? (
            <>
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
            </>
          ) : (
            <>
              {userStats.networkStats && (
                <>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <StatCard
                        title="Avg Download Speed"
                        value={`${userStats.networkStats.avgDownloadSpeed.toFixed(2)} Mbps`}
                        icon={SpeedIcon}
                        color="#2e7d32"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <StatCard
                        title="Avg Signal Strength"
                        value={`${userStats.networkStats.avgSignalStrength.toFixed(0)} dBm`}
                        icon={SignalIcon}
                        color="#1976d2"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <StatCard title="Total RX" value={formatBytes(userStats.networkStats.totalRxBytes)} icon={StorageIcon} color="#9c27b0" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <StatCard title="Total TX" value={formatBytes(userStats.networkStats.totalTxBytes)} icon={StorageIcon} color="#d32f2f" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <StatCard title="Avg Ping" value={`${userStats.networkStats.avgPing.toFixed(0)} ms`} icon={NetworkIcon} color="#ed6c02" />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Paper sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Network Types Distribution</Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={userStats.networkStats.networkTypes}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {userStats.networkStats.networkTypes.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.type === "WiFi" ? "#1976d2" : entry.type === "LTE" ? "#2e7d32" : entry.type === "3G/2G" ? "#ed6c02" : "#9c27b0"}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} connections`, "Count"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Box>

                  <Box sx={{ mt: 4 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Network Speed Metrics" chartId="network-speed">
                          <ResponsiveContainer width="100%" height={300}>
                            <NetworkSpeedChart />
                          </ResponsiveContainer>
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Signal Quality" chartId="network-signal">
                          <ResponsiveContainer width="100%" height={300}>
                            <NetworkSignalChart />
                          </ResponsiveContainer>
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Data Usage Over Time" chartId="network-data">
                          <ResponsiveContainer width="100%" height={300}>
                            <NetworkDataChart />
                          </ResponsiveContainer>
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Network Quality" chartId="network-quality">
                          <ResponsiveContainer width="100%" height={300}>
                            <NetworkQualityChart />
                          </ResponsiveContainer>
                        </ChartContainer>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <ChartContainer title="Battery Status" chartId="network-battery">
                          <ResponsiveContainer width="100%" height={300}>
                            <NetworkBatteryChart />
                          </ResponsiveContainer>
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
                        value={expandedChart ? getDateRange(expandedChart).startDate : undefined}
                        onChange={(newValue) => expandedChart && newValue && handleDateRangeChange(expandedChart, "startDate", newValue)}
                        maxDate={expandedChart ? getDateRange(expandedChart).endDate : undefined}
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
                        value={expandedChart ? getDateRange(expandedChart).endDate : undefined}
                        onChange={(newValue) => expandedChart && newValue && handleDateRangeChange(expandedChart, "endDate", newValue)}
                        minDate={expandedChart ? getDateRange(expandedChart).startDate : undefined}
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
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={generateContinuousData(userMeasurements, "device_status", expandedChart).map((m) => ({
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
                    <ResponsiveContainer width="100%" height="100%">
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
                    <ResponsiveContainer width="100%" height="100%">
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
                        <YAxis />
                        <Tooltip
                          labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                              return formatMonthDayHour(payload[0].payload.rawTimestamp);
                            }
                            return "";
                          }}
                          formatter={(value: any) => [`${value}%`, "Battery Level"]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="battery" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.1} strokeWidth={2} name="Battery Level" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {expandedChart === "button-press" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={generateContinuousData(userMeasurements, "button_press", expandedChart).map((m) => ({
                          ...m,
                          buttonPress: m.value === "button" ? 1 : 0,
                          notificationPress: m.value === "notification" ? 1 : 0,
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
                  {expandedChart === "network-speed" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <NetworkSpeedChart />
                    </ResponsiveContainer>
                  )}
                  {expandedChart === "network-signal" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <NetworkSignalChart />
                    </ResponsiveContainer>
                  )}
                  {expandedChart === "network-data" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <NetworkDataChart />
                    </ResponsiveContainer>
                  )}
                  {expandedChart === "network-quality" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <NetworkQualityChart />
                    </ResponsiveContainer>
                  )}
                  {expandedChart === "network-battery" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <NetworkBatteryChart />
                    </ResponsiveContainer>
                  )}
                </Box>
              </LocalizationProvider>
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
