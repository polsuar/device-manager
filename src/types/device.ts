export interface Device {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline";
  batteryLevel: number;
  signalStrength: number;
  lastSeen: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceFilters {
  status?: "online" | "offline";
  type?: string;
  search?: string;
}

export interface DevicePagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
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

export interface NetworkLogFilters {
  startDate?: Date;
  endDate?: Date;
  networkType?: string;
}
