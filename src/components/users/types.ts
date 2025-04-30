export interface UserStats {
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

export interface Measurement {
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

export interface UserBasic {
  userId: string;
  email: string;
}

export interface ChartDateRange {
  startDate: Date;
  endDate: Date;
}

export interface NetworkLog {
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

export interface NetworkLogData {
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

export interface ChartData {
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

export interface SelectedUser {
  userId: string;
  networkLogs: NetworkLog[];
  measurements: Measurement[];
}
