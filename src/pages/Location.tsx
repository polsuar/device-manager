import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { useDevices } from "../hooks/useDevices";

interface LocationData {
  id: string;
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
}

interface Device {
  id: string;
  name: string;
}

// Crear un icono personalizado para los marcadores
const customIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

export default function Location() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const {
    devices: backendDevices,
    loading,
    error,
  } = useDevices({
    page: 0,
    pageSize: 100,
  });

  useEffect(() => {
    if (backendDevices) {
      const deviceLocations = backendDevices.map((device) => ({
        id: device.id,
        deviceId: device.id,
        deviceName: device.name,
        latitude: device.location.latitude,
        longitude: device.location.longitude,
        timestamp: new Date().toISOString(),
        accuracy: 10, // Assuming a default accuracy
      }));
      setLocations(deviceLocations);
      if (deviceLocations.length > 0) {
        setCenter([deviceLocations[0].latitude, deviceLocations[0].longitude]);
      }
    }
  }, [backendDevices]);

  const filteredLocations = selectedDevice ? locations.filter((loc) => loc.deviceId === selectedDevice) : locations;

  if (loading) return <Typography>Cargando ubicaciones...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ubicación de Dispositivos
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Selection
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Device</InputLabel>
                <Select value={selectedDevice} label="Select Device" onChange={(e) => setSelectedDevice(e.target.value)}>
                  <MenuItem value="">All Devices</MenuItem>
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 500, p: 2 }}>
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredLocations.map((location) => (
                <Marker key={location.id} position={[location.latitude, location.longitude]} icon={customIcon}>
                  <Popup>
                    <Typography variant="subtitle1">{location.deviceName}</Typography>
                    <Typography variant="body2">Accuracy: {location.accuracy}m</Typography>
                    <Typography variant="body2">Last updated: {new Date(location.timestamp).toLocaleString()}</Typography>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Latitude</TableCell>
                  <TableCell>Longitude</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.deviceName}</TableCell>
                    <TableCell>{location.latitude.toFixed(6)}</TableCell>
                    <TableCell>{location.longitude.toFixed(6)}</TableCell>
                    <TableCell>{location.accuracy}m</TableCell>
                    <TableCell>{new Date(location.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
