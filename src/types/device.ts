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
