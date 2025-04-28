import { useParams, useNavigate } from "react-router-dom";
import { DeviceDetailTemplate, DeviceDetail } from "../components/templates/DeviceDetailTemplate";

// Datos de ejemplo
const mockDevice: DeviceDetail = {
  id: "1",
  name: "Sensor de Temperatura 1",
  type: "sensor",
  status: "online",
  batteryLevel: 85,
  signalStrength: 90,
  lastSeen: "2024-03-27 10:30:00",
  location: {
    latitude: 19.4326,
    longitude: -99.1332,
    address: "Ciudad de México, México",
  },
  settings: {
    updateInterval: 60,
    threshold: 30,
    notifications: true,
  },
};

export const DeviceDetailPage = () => {
  useParams<{ id: string; }>();
  const navigate = useNavigate();

  const handleEdit = (deviceId: string) => {
    // TODO: Implementar lógica para editar dispositivo
    console.log("Editar dispositivo:", deviceId);
  };

  const handleDelete = (deviceId: string) => {
    // TODO: Implementar lógica para eliminar dispositivo
    console.log("Eliminar dispositivo:", deviceId);
    navigate("/devices");
  };

  const handleConfigure = (deviceId: string) => {
    // TODO: Implementar lógica para configurar dispositivo
    console.log("Configurar dispositivo:", deviceId);
  };

  // En un caso real, aquí cargaríamos los datos del dispositivo desde una API
  const device = mockDevice;

  return <DeviceDetailTemplate device={device} onEdit={handleEdit} onDelete={handleDelete} onConfigure={handleConfigure} />;
};
