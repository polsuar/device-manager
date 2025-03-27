import { useState, useEffect } from "react";
import { deviceService } from "../services/deviceService";
import { DeviceDetail } from "../components/templates/DeviceListTemplate";

interface UseDeviceReturn {
  device: DeviceDetail | null;
  loading: boolean;
  error: string | null;
  refreshDevice: () => Promise<void>;
  updateDevice: (device: Partial<DeviceDetail>) => Promise<void>;
  deleteDevice: () => Promise<void>;
}

export const useDevice = (id: string): UseDeviceReturn => {
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevice = async () => {
    try {
      setLoading(true);
      setError(null);
      const deviceData = await deviceService.getDeviceById(id);
      setDevice(deviceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el dispositivo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDevice();
    }
  }, [id]);

  const refreshDevice = async () => {
    await fetchDevice();
  };

  const updateDevice = async (deviceData: Partial<DeviceDetail>) => {
    try {
      setLoading(true);
      setError(null);
      await deviceService.updateDevice(id, deviceData);
      await refreshDevice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el dispositivo");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async () => {
    try {
      setLoading(true);
      setError(null);
      await deviceService.deleteDevice(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el dispositivo");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    device,
    loading,
    error,
    refreshDevice,
    updateDevice,
    deleteDevice,
  };
};
