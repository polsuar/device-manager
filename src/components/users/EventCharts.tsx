import React from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Measurement } from "./types";
import { formatHour, formatMonthDayHour, getLast24HDataByType } from "./utils";

interface ChartProps {
  data: Measurement[];
  chartId: string;
}

export const DeviceStatusChart: React.FC<ChartProps> = ({ data, chartId }) => {
  const chartData = data
    .filter((m) => m.type === "off_body")
    .map((m) => ({
      timestamp: formatHour(m.timestamp),
      rawTimestamp: m.timestamp,
      status: m.value ? 0 : 1,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
  );
};

export const WifiStatusChart: React.FC<ChartProps> = ({ data, chartId }) => {
  const chartData = data
    .filter((m) => m.type === "wifi_connected")
    .map((m) => ({
      timestamp: formatHour(m.timestamp),
      rawTimestamp: m.timestamp,
      connected: m.value ? 1 : 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
  );
};

export const BatteryLevelChart: React.FC<ChartProps> = ({ data, chartId }) => {
  const chartData = data
    .filter((m) => m.type === "low_battery")
    .map((m) => ({
      timestamp: formatHour(m.timestamp),
      rawTimestamp: m.timestamp,
      battery: m.value,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          formatter={(value: any) => [`${value}%`, "Battery Level"]}
        />
        <Legend />
        <Area type="monotone" dataKey="battery" stroke="#ed6c02" fill="#ed6c02" fillOpacity={0.1} strokeWidth={2} name="Battery Level" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const ButtonPressChart: React.FC<ChartProps> = ({ data }) => {
  const buttonPress = getLast24HDataByType(data, "button_press");
  const notificationPress = getLast24HDataByType(data, "notification_button_press");
  const merged = [...buttonPress, ...notificationPress]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((m) => ({
      timestamp: formatHour(m.timestamp),
      rawTimestamp: m.timestamp,
      buttonPress: m.type === "button_press" ? 1 : 0,
      notificationPress: m.type === "notification_button_press" ? 1 : 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={merged} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
  );
};
