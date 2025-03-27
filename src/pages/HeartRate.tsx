import { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HeartRateData {
  timestamp: string;
  value: number;
}

interface Device {
  id: string;
  name: string;
  currentHeartRate: number;
  averageHeartRate: number;
}

export default function HeartRate() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [heartRateData, setHeartRateData] = useState<HeartRateData[]>([]);

  useEffect(() => {
    // TODO: Fetch real devices and heart rate data from your backend
    setDevices([
      {
        id: "1",
        name: "Smart Watch 1",
        currentHeartRate: 75,
        averageHeartRate: 72,
      },
      {
        id: "2",
        name: "Fitness Tracker 1",
        currentHeartRate: 68,
        averageHeartRate: 70,
      },
    ]);

    // Generate sample heart rate data
    const data: HeartRateData[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      data.push({
        timestamp: new Date(now.getTime() - (23 - i) * 3600000).toISOString(),
        value: Math.floor(Math.random() * (85 - 65) + 65),
      });
    }
    setHeartRateData(data);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Heart Rate Monitoring
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Heart Rate
              </Typography>
              <Typography variant="h3" color="primary">
                {devices.find((d) => d.id === selectedDevice)?.currentHeartRate || 0} bpm
              </Typography>
              <LinearProgress variant="determinate" value={75} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Heart Rate
              </Typography>
              <Typography variant="h3" color="secondary">
                {devices.find((d) => d.id === selectedDevice)?.averageHeartRate || 0} bpm
              </Typography>
              <LinearProgress variant="determinate" value={70} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Selection
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Device</InputLabel>
                <Select value={selectedDevice} label="Select Device" onChange={(e) => setSelectedDevice(e.target.value)}>
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
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Heart Rate History (24 Hours)
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                  <YAxis domain={[60, 100]} />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Line type="monotone" dataKey="value" stroke="#1976d2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
