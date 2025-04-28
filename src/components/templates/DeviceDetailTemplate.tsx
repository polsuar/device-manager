import { Box, Grid } from "@mui/material";
import { Card } from "../atoms/Card";
import { CardHeader } from "../molecules/CardHeader";
import { Typography } from "../atoms/Typography";
import { ActionButton } from "../molecules/ActionButton";
import DeviceIcon from "@mui/icons-material/Devices";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BatteryIcon from "@mui/icons-material/BatteryFull";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SettingsIcon from "@mui/icons-material/Settings";

export interface DeviceDetail {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline";
  batteryLevel: number;
  signalStrength: number;
  lastSeen: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  settings: {
    updateInterval: number;
    threshold: number;
    notifications: boolean;
  };
}

export interface DeviceDetailTemplateProps {
  device: DeviceDetail;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConfigure: (id: string) => void;
}

export const DeviceDetailTemplate = ({ device, onEdit, onDelete, onConfigure }: DeviceDetailTemplateProps) => {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" weight="bold">
          Detalles del Dispositivo
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <ActionButton icon={EditIcon} label="Editar" onClick={() => onEdit(device.id)} variant="outline" />
          <ActionButton icon={DeleteIcon} label="Eliminar" onClick={() => onDelete(device.id)} variant="outline" />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={device.name} icon={DeviceIcon} subtitle={device.type} />
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BatteryIcon color={device.batteryLevel > 20 ? "success" : "error"} />
                    <Typography variant="body2">{device.batteryLevel}% batería</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SignalCellularAltIcon color={device.status === "online" ? "success" : "error"} />
                    <Typography variant="body2">{device.status === "online" ? "En línea" : "Fuera de línea"}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon />
                    <Typography variant="body2">Última vez: {device.lastSeen}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Ubicación" icon={LocationOnIcon} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">{device.location.address}</Typography>
              <Typography variant="body2" color="text.secondary">
                Lat: {device.location.latitude}, Lon: {device.location.longitude}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Configuración"
              icon={SettingsIcon}
              action={<ActionButton icon={SettingsIcon} label="Configurar" onClick={() => onConfigure(device.id)} variant="outline" />}
            />
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" weight="medium">
                    Intervalo de actualización
                  </Typography>
                  <Typography variant="body2">{device.settings.updateInterval} segundos</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" weight="medium">
                    Umbral
                  </Typography>
                  <Typography variant="body2">{device.settings.threshold}%</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" weight="medium">
                    Notificaciones
                  </Typography>
                  <Typography variant="body2">{device.settings.notifications ? "Activadas" : "Desactivadas"}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
