import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BatteryData {
  id: string;
  deviceId: string;
  deviceName: string;
  currentLevel: number;
  averageLevel: number;
  lastCharged: string;
  chargingStatus: "charging" | "not_charging";
}

interface Device {
  id: string;
  name: string;
}

export default function Battery() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [batteryData, setBatteryData] = useState<BatteryData[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Fetch real devices and battery data from your backend
    setDevices([
      {
        id: "1",
        name: "Smart Watch 1",
      },
      {
        id: "2",
        name: "Fitness Tracker 1",
      },
    ]);

    // Generate sample battery data
    const data: BatteryData[] = [
      {
        id: "1",
        deviceId: "1",
        deviceName: "Smart Watch 1",
        currentLevel: 85,
        averageLevel: 75,
        lastCharged: new Date(Date.now() - 24 * 3600000).toISOString(),
        chargingStatus: "not_charging",
      },
      {
        id: "2",
        deviceId: "2",
        deviceName: "Fitness Tracker 1",
        currentLevel: 45,
        averageLevel: 60,
        lastCharged: new Date(Date.now() - 48 * 3600000).toISOString(),
        chargingStatus: "charging",
      },
    ];
    setBatteryData(data);

    // Generate sample historical data
    const historical: any[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      historical.push({
        date: new Date(now.getTime() - (6 - i) * 24 * 3600000).toISOString(),
        "Smart Watch 1": Math.floor(Math.random() * (90 - 60) + 60),
        "Fitness Tracker 1": Math.floor(Math.random() * (80 - 40) + 40),
      });
    }
    setHistoricalData(historical);
  }, []);

  const filteredData = selectedDevice ? batteryData.filter((data) => data.deviceId === selectedDevice) : batteryData;

  const getBatteryColor = (level: number) => {
    if (level >= 80) return "success";
    if (level >= 40) return "warning";
    return "error";
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Battery Status
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Selection
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Device</InputLabel>
                <Select value={selectedDevice} label="Select Device" onChange={(e) => setSelectedDevice(e.target.value)}>
                  <MenuItem value="">All Devices</MenuItem>
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Battery Level History (7 Days)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Bar dataKey="Smart Watch 1" fill="#1976d2" />
                  <Bar dataKey="Fitness Tracker 1" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Current Level</TableCell>
                  <TableCell>Average Level</TableCell>
                  <TableCell>Charging Status</TableCell>
                  <TableCell>Last Charged</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.deviceName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip label={`${data.currentLevel}%`} color={getBatteryColor(data.currentLevel)} size="small" />
                        <LinearProgress variant="determinate" value={data.currentLevel} sx={{ width: 100, height: 8, borderRadius: 4 }} />
                      </Box>
                    </TableCell>
                    <TableCell>{data.averageLevel}%</TableCell>
                    <TableCell>
                      <Chip
                        label={data.chargingStatus === "charging" ? "Charging" : "Not Charging"}
                        color={data.chargingStatus === "charging" ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(data.lastCharged).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
