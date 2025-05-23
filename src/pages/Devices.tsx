import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Box, Grid, Paper, Typography, Card, CardContent } from "@mui/material";
import { DevicesOther as DevicesIcon, BatteryFull as BatteryIcon, Favorite as HeartRateIcon, Wifi as WifiIcon } from "@mui/icons-material";
import { collection, getDocs, doc } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getFirebaseInstance } from "../config/firebase";
import { Device, DeviceStatus, DeviceType } from "../types/device";
import { deviceService } from "../services/deviceService";

interface Measurement {
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
  };
}

interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  averageBattery: number;
  averageHeartRate: number;
  devicesWithLocation: number;
  measurements: Measurement[];
}

export default function Devices() {
  const { user } = useAuth();
  const { db } = getFirebaseInstance();
  const [stats, setStats] = useState<DeviceStats>({
    totalDevices: 0,
    activeDevices: 0,
    averageBattery: 0,
    averageHeartRate: 0,
    devicesWithLocation: 0,
    measurements: [],
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState<DeviceFilters>({});
  const [pagination, setPagination] = useState<DevicePagination>({
    page: 0,
    pageSize: 10,
  });
  const [totalDevices, setTotalDevices] = useState(0);

  useEffect(() => {
    const fetchDeviceStats = async () => {
      try {
        console.log("Iniciando conexión con Firebase...");

        // Obtener userId de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get("userId");

        if (!userId) {
          console.error("No se encontró userId");
          return;
        }

        console.log("Buscando eventos para el usuario:", userId);

        // Referencia a la colección EVENTS del usuario
        const eventsRef = collection(doc(db, "users", userId), "EVENTS");
        console.log("Referencia a colección creada:", eventsRef);

        const eventsSnapshot = await getDocs(eventsRef);
        console.log("Snapshot obtenido:", eventsSnapshot.size, "documentos");

        if (eventsSnapshot.empty) {
          console.warn("No se encontraron eventos para este usuario");
          return;
        }

        const measurements = eventsSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Documento procesado:", doc.id, data);

          // Extraer el evento del documento
          const eventKey = Object.keys(data)[0];
          const eventData = data[eventKey];

          return {
            timestamp: parseInt(doc.id),
            type: eventKey.split(".")[0], // Ejemplo: "wifi_connected.Error" -> "wifi_connected"
            value: eventData.value,
            measurements: eventData.measurements || {},
          };
        });

        console.log("Eventos procesados:", measurements.length);

        // Procesar las mediciones para obtener estadísticas
        const wifiEvents = measurements.filter((m) => m.type === "wifi_connected");
        const batteryEvents = measurements.filter((m) => m.type === "low_battery");
        const fallEvents = measurements.filter((m) => m.type === "probable_fall");
        const offBodyEvents = measurements.filter((m) => m.type === "off_body");

        console.log("Eventos encontrados:", {
          wifi: wifiEvents.length,
          battery: batteryEvents.length,
          falls: fallEvents.length,
          offBody: offBodyEvents.length,
        });

        setStats((prev) => ({
          ...prev,
          measurements,
          totalDevices: 1,
          activeDevices: wifiEvents.filter((e) => e.value).length > 0 ? 1 : 0,
          averageBattery: batteryEvents.length > 0 ? batteryEvents.reduce((acc, curr) => acc + curr.value, 0) / batteryEvents.length : 0,
          averageHeartRate: 0,
          devicesWithLocation: measurements.filter((m) => m.measurements?.location?.lat !== 0).length,
        }));
      } catch (error) {
        console.error("Error fetching device stats:", error);
        if (error instanceof Error) {
          console.error("Mensaje de error:", error.message);
          console.error("Stack trace:", error.stack);
        }
      }
    };

    fetchDeviceStats();
  }, [db]);

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const [devicesData, total] = await Promise.all([deviceService.getDevices(filters, pagination), deviceService.getTotalDevices(filters)]);
        setDevices(devicesData);
        setTotalDevices(total);
      } catch (error) {
        console.error("Error fetching devices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [filters, pagination]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Device Events
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <WifiIcon sx={{ color: "#1976d2", mr: 1 }} />
                <Typography variant="h6">WiFi Events</Typography>
              </Box>
              <Typography variant="h4">{stats.measurements.filter((m) => m.type === "wifi_connected").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BatteryIcon sx={{ color: "#ed6c02", mr: 1 }} />
                <Typography variant="h6">Battery Events</Typography>
              </Box>
              <Typography variant="h4">{stats.measurements.filter((m) => m.type === "low_battery").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <HeartRateIcon sx={{ color: "#d32f2f", mr: 1 }} />
                <Typography variant="h6">Fall Events</Typography>
              </Box>
              <Typography variant="h4">{stats.measurements.filter((m) => m.type === "probable_fall").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <DevicesIcon sx={{ color: "#2e7d32", mr: 1 }} />
                <Typography variant="h6">Off Body Events</Typography>
              </Box>
              <Typography variant="h4">{stats.measurements.filter((m) => m.type === "off_body").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                WiFi Connection Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={stats.measurements
                    .filter((m) => m.type === "wifi_connected")
                    .map((m) => ({
                      timestamp: new Date(m.timestamp).toLocaleTimeString(),
                      connected: m.value ? 1 : 0,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="connected" stroke="#1976d2" name="WiFi Connected" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Battery Level
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={stats.measurements
                    .filter((m) => m.type === "low_battery")
                    .map((m) => ({
                      timestamp: new Date(m.timestamp).toLocaleTimeString(),
                      battery: m.value,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="battery" stroke="#ed6c02" name="Battery Level" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Fall Detection Events
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.measurements
                    .filter((m) => m.type === "probable_fall")
                    .map((m) => ({
                      timestamp: new Date(m.timestamp).toLocaleTimeString(),
                      falls: 1,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="falls" fill="#d32f2f" name="Fall Events" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Device Status (On/Off Body)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={stats.measurements
                    .filter((m) => m.type === "off_body")
                    .map((m) => ({
                      timestamp: new Date(m.timestamp).toLocaleTimeString(),
                      offBody: m.value ? 1 : 0,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="offBody" stroke="#2e7d32" name="Off Body" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
