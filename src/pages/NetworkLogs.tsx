import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Box, Grid, Paper, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, TextField } from "@mui/material";
import { NetworkLog, NetworkLogFilters } from "../types/device";
import { networkLogService } from "../services/networkLogService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { SignalCellular0Bar as SignalIcon, Speed as SpeedIcon, Battery90 as BatteryIcon, Storage as StorageIcon } from "@mui/icons-material";
import { format } from "date-fns";

export default function NetworkLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [networkTypes, setNetworkTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<NetworkLogFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      setLoading(true);
      try {
        const [logsData, types] = await Promise.all([networkLogService.getNetworkLogs(user.uid, filters), networkLogService.getNetworkTypes(user.uid)]);
        setLogs(logsData);
        setNetworkTypes(types);
      } catch (error) {
        console.error("Error fetching network logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, filters]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp: { seconds: number; nanoseconds: number }) => {
    return format(new Date(timestamp.seconds * 1000), "yyyy-MM-dd HH:mm:ss");
  };

  const getAverageMetrics = () => {
    if (logs.length === 0) return null;

    return {
      avgSignal: Math.round(logs.reduce((acc, log) => acc + log.signalStrength, 0) / logs.length),
      avgSpeed: (logs.reduce((acc, log) => acc + (log.downloadSpeed > 0 ? log.downloadSpeed : 0), 0) / logs.length).toFixed(2),
      avgPing: Math.round(logs.reduce((acc, log) => acc + log.ping, 0) / logs.length),
      totalRx: formatBytes(logs.reduce((acc, log) => acc + log.data_usage.rx_bytes, 0)),
      totalTx: formatBytes(logs.reduce((acc, log) => acc + log.data_usage.tx_bytes, 0)),
    };
  };

  const metrics = getAverageMetrics();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Network Logs
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Network Type</InputLabel>
              <Select
                value={filters.networkType || ""}
                label="Network Type"
                onChange={(e) => setFilters({ ...filters, networkType: e.target.value || undefined })}
              >
                <MenuItem value="">All</MenuItem>
                {networkTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value ? new Date(e.target.value) : undefined })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              type="date"
              label="End Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value ? new Date(e.target.value) : undefined })}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <SignalIcon sx={{ color: "#1976d2", mr: 1 }} />
                  <Typography variant="h6">Signal Strength</Typography>
                </Box>
                <Typography variant="h4">{metrics.avgSignal} dBm</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <SpeedIcon sx={{ color: "#2e7d32", mr: 1 }} />
                  <Typography variant="h6">Avg Speed</Typography>
                </Box>
                <Typography variant="h4">{metrics.avgSpeed} Mbps</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BatteryIcon sx={{ color: "#ed6c02", mr: 1 }} />
                  <Typography variant="h6">Avg Ping</Typography>
                </Box>
                <Typography variant="h4">{metrics.avgPing} ms</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <StorageIcon sx={{ color: "#9c27b0", mr: 1 }} />
                  <Typography variant="h6">Total RX</Typography>
                </Box>
                <Typography variant="h4">{metrics.totalRx}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <StorageIcon sx={{ color: "#d32f2f", mr: 1 }} />
                  <Typography variant="h6">Total TX</Typography>
                </Box>
                <Typography variant="h4">{metrics.totalTx}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Download Speed Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={logs.map((log) => ({
                  timestamp: formatTimestamp(log.timestamp),
                  speed: log.downloadSpeed,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="speed" stroke="#2e7d32" name="Download Speed (Mbps)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Signal Strength Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={logs.map((log) => ({
                  timestamp: formatTimestamp(log.timestamp),
                  signal: log.signalStrength,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="signal" stroke="#1976d2" name="Signal Strength (dBm)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Usage Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={logs.map((log) => ({
                  timestamp: formatTimestamp(log.timestamp),
                  rx: log.data_usage.rx_bytes,
                  tx: log.data_usage.tx_bytes,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => formatBytes(value)} />
                <Legend />
                <Area type="monotone" dataKey="rx" stackId="1" stroke="#9c27b0" fill="#9c27b0" name="RX" />
                <Area type="monotone" dataKey="tx" stackId="1" stroke="#d32f2f" fill="#d32f2f" name="TX" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Quality Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={logs.map((log) => ({
                  timestamp: formatTimestamp(log.timestamp),
                  ping: log.ping,
                  jitter: log.jitter,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ping" stroke="#ed6c02" name="Ping (ms)" />
                <Line type="monotone" dataKey="jitter" stroke="#673ab7" name="Jitter (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
