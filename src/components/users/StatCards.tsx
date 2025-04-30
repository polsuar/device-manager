import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import {
  DevicesOther as DevicesIcon,
  BatteryFull as BatteryIcon,
  Favorite as HeartRateIcon,
  Wifi as WifiIcon,
  Speed as SpeedIcon,
  SignalCellularConnectedNoInternet4Bar as SignalIcon,
  Storage as StorageIcon,
  NetworkWifi as NetworkIcon,
} from "@mui/icons-material";
import { formatBytes } from "./utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <Paper
    sx={{
      p: 2,
      display: "flex",
      alignItems: "center",
      gap: 2,
      minWidth: 200,
      flex: "1 0 auto",
    }}
  >
    <Icon sx={{ color, fontSize: 40 }} />
    <Box>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  </Paper>
);

interface NetworkStatsProps {
  avgDownloadSpeed: number;
  avgSignalStrength: number;
  totalRxBytes: number;
  totalTxBytes: number;
  avgPing: number;
}

export const NetworkStats: React.FC<NetworkStatsProps> = ({ avgDownloadSpeed, avgSignalStrength, totalRxBytes, totalTxBytes, avgPing }) => (
  <>
    <Box sx={{ display: "flex", gap: 3, width: "100%", overflowX: "auto", py: 1 }}>
      <StatCard title="Avg Download Speed" value={`${avgDownloadSpeed.toFixed(2)} Mbps`} icon={SpeedIcon} color="#2e7d32" />
      <StatCard title="Avg Signal Strength" value={`${avgSignalStrength.toFixed(0)} dBm`} icon={SignalIcon} color="#1976d2" />
      <StatCard title="Total RX" value={formatBytes(totalRxBytes)} icon={StorageIcon} color="#9c27b0" />
      <StatCard title="Total TX" value={formatBytes(totalTxBytes)} icon={StorageIcon} color="#d32f2f" />
      <StatCard title="Avg Ping" value={`${avgPing.toFixed(0)} ms`} icon={NetworkIcon} color="#ed6c02" />
    </Box>
  </>
);

interface DeviceStatsProps {
  totalDevices: number;
  activeDevices: number;
  averageBattery: number;
  averageHeartRate: number;
}

export const DeviceStats: React.FC<DeviceStatsProps> = ({ totalDevices, activeDevices, averageBattery, averageHeartRate }) => (
  <>
    <Box sx={{ display: "flex", gap: 3, width: "100%", overflowX: "auto", py: 1 }}>
      <StatCard title="Total Devices" value={totalDevices} icon={DevicesIcon} color="#1976d2" />
      <StatCard title="Active Devices" value={activeDevices} icon={WifiIcon} color="#2e7d32" />
      <StatCard title="Avg Battery" value={`${averageBattery.toFixed(1)}%`} icon={BatteryIcon} color="#ed6c02" />
      <StatCard title="Avg Heart Rate" value={`${averageHeartRate} bpm`} icon={HeartRateIcon} color="#d32f2f" />
    </Box>
  </>
);
