import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  BatteryAlert as BatteryIcon,
  LocationOn as LocationIcon,
  Favorite as HeartRateIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface Notification {
  id: string;
  type: "battery" | "location" | "heart_rate";
  message: string;
  deviceName: string;
  timestamp: string;
  read: boolean;
}

interface Device {
  id: string;
  name: string;
}

export default function Notifications() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // TODO: Fetch real devices and notifications from your backend
    setDevices([
      {
        id: "1",
        name: "Smart Watch 1",
      },
      {
        id: "2",
        name: "Fitness Tracker 1",
      },
    ]);

    // Generate sample notifications
    const data: Notification[] = [
      {
        id: "1",
        type: "battery",
        message: "Battery level is below 20%",
        deviceName: "Smart Watch 1",
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        read: false,
      },
      {
        id: "2",
        type: "location",
        message: "Device location updated",
        deviceName: "Fitness Tracker 1",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        read: true,
      },
      {
        id: "3",
        type: "heart_rate",
        message: "High heart rate detected",
        deviceName: "Smart Watch 1",
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        read: false,
      },
    ];
    setNotifications(data);
  }, []);

  const filteredNotifications = selectedDevice
    ? notifications.filter((notification) => notification.deviceName === devices.find((d) => d.id === selectedDevice)?.name)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "battery":
        return <BatteryIcon />;
      case "location":
        return <LocationIcon />;
      case "heart_rate":
        return <HeartRateIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "battery":
        return "warning";
      case "location":
        return "info";
      case "heart_rate":
        return "error";
      default:
        return "default";
    }
  };

  const handleDelete = (id: string) => {
    // TODO: Implement notification deletion logic
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Filter
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
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <List>
              {filteredNotifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? "inherit" : "action.hover",
                    }}
                  >
                    <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1">{notification.message}</Typography>
                          <Chip label={notification.type.replace("_", " ")} color={getNotificationColor(notification.type)} size="small" />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {notification.deviceName} • {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(notification.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
