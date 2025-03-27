import { useState, useEffect } from "react";
import { deviceService } from "../services/deviceService";
import { Device, DeviceDetail } from "../components/templates/DeviceListTemplate";

interface UseDevicesProps {
  page: number;
  pageSize: number;
  searchValue?: string;
  statusFilter?: string;
  typeFilter?: string;
}

interface UseDevicesReturn {
  devices: Device[];
  loading: boolean;
  error: string | null;
  totalDevices: number;
  refreshDevices: () => Promise<void>;
  addDevice: (device: Omit<DeviceDetail, "id">) => Promise<void>;
  updateDevice: (id: string, device: Partial<DeviceDetail>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
}

export const useDevices = ({ page, pageSize, searchValue = "", statusFilter = "", typeFilter = "" }: UseDevicesProps): UseDevicesReturn => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDevices, setTotalDevices] = useState(0);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const [devicesData, total] = await Promise.all([
        deviceService.getDevices(page, pageSize, {
          search: searchValue,
          status: statusFilter,
          type: typeFilter,
        }),
        deviceService.getTotalDevices({
          status: statusFilter,
          type: typeFilter,
        }),
      ]);

      setDevices(devicesData);
      setTotalDevices(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los dispositivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [page, pageSize, searchValue, statusFilter, typeFilter]);

  const refreshDevices = async () => {
    await fetchDevices();
  };

  const addDevice = async (device: Omit<DeviceDetail, "id">) => {
    try {
      setLoading(true);
      setError(null);
      await deviceService.createDevice(device);
      await refreshDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el dispositivo");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDevice = async (id: string, device: Partial<DeviceDetail>) => {
    try {
      setLoading(true);
      setError(null);
      await deviceService.updateDevice(id, device);
      await refreshDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el dispositivo");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deviceService.deleteDevice(id);
      await refreshDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el dispositivo");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    devices,
    loading,
    error,
    totalDevices,
    refreshDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  };
};
