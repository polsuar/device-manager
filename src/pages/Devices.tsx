import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

interface Device {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive";
  battery: number;
  lastSeen: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
  });

  useEffect(() => {
    // TODO: Fetch real devices from your backend
    setDevices([
      {
        id: "1",
        name: "Smart Watch 1",
        type: "wearable",
        status: "active",
        battery: 85,
        lastSeen: "2024-03-20T10:30:00Z",
      },
      {
        id: "2",
        name: "Fitness Tracker 1",
        type: "wearable",
        status: "inactive",
        battery: 45,
        lastSeen: "2024-03-19T15:45:00Z",
      },
    ]);
  }, []);

  const handleOpenDialog = (device?: Device) => {
    if (device) {
      setSelectedDevice(device);
      setFormData({
        name: device.name,
        type: device.type,
      });
    } else {
      setSelectedDevice(null);
      setFormData({
        name: "",
        type: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDevice(null);
  };

  const handleSubmit = () => {
    // TODO: Implement device creation/update logic
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    // TODO: Implement device deletion logic
    console.log("Delete device:", id);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Devices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Device
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Battery</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.type}</TableCell>
                <TableCell>
                  <Chip label={device.status} color={device.status === "active" ? "success" : "default"} size="small" />
                </TableCell>
                <TableCell>{device.battery}%</TableCell>
                <TableCell>{new Date(device.lastSeen).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(device)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(device.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedDevice ? "Edit Device" : "Add New Device"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" />
            <TextField fullWidth label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedDevice ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
