import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { NetworkLogData } from "./types";
import { formatTimestamp, formatBytes } from "./utils";

interface ChartProps {
  data: NetworkLogData[];
}

export const NetworkSpeedChart: React.FC<ChartProps> = ({ data }) => {
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

export const NetworkSignalChart: React.FC<ChartProps> = ({ data }) => {
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

export const NetworkDataChart: React.FC<ChartProps> = ({ data }) => {
  const maxBytes = data.reduce((max, point) => {
    const rxBytes = point.data_usage?.rx_bytes || 0;
    const txBytes = point.data_usage?.tx_bytes || 0;
    return Math.max(max, rxBytes, txBytes);
  }, 0);

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

export const NetworkQualityChart: React.FC<ChartProps> = ({ data }) => {
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

export const NetworkBatteryChart: React.FC<ChartProps> = ({ data }) => {
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
