import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Box, Grid, Paper, Typography, Card, CardContent, CardHeader, LinearProgress } from "@mui/material";
import { DevicesOther as DevicesIcon, BatteryFull as BatteryIcon, Favorite as HeartRateIcon, LocationOn as LocationIcon } from "@mui/icons-material";

interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  averageBattery: number;
  averageHeartRate: number;
  devicesWithLocation: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DeviceStats>({
    totalDevices: 0,
    activeDevices: 0,
    averageBattery: 0,
    averageHeartRate: 0,
    devicesWithLocation: 0,
  });

  useEffect(() => {
    // TODO: Fetch real stats from your backend
    setStats({
      totalDevices: 5,
      activeDevices: 3,
      averageBattery: 75,
      averageHeartRate: 72,
      devicesWithLocation: 4,
    });
  }, []);

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.email}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Devices" value={stats.totalDevices} icon={DevicesIcon} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Devices" value={stats.activeDevices} icon={BatteryIcon} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg Battery" value={`${stats.averageBattery}%`} icon={BatteryIcon} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg Heart Rate" value={`${stats.averageHeartRate} bpm`} icon={HeartRateIcon} color="#d32f2f" />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Device Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Active Devices
              </Typography>
              <LinearProgress variant="determinate" value={(stats.activeDevices / stats.totalDevices) * 100} sx={{ height: 10, borderRadius: 5 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Devices with Location
              </Typography>
              <LinearProgress variant="determinate" value={(stats.devicesWithLocation / stats.totalDevices) * 100} sx={{ height: 10, borderRadius: 5 }} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}
