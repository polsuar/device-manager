import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from "@mui/material";
import { Device, DeviceStatus, DeviceType } from "../types/device";
import { deviceService } from "../services/deviceService";

interface DeviceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (device: Device) => void;
  device?: Device;
}

export default function DeviceDialog({ open, onClose, onSave, device }: DeviceDialogProps) {
  const [formData, setFormData] = useState<Partial<Device>>({
    name: "",
    type: DeviceType.SENSOR,
    status: DeviceStatus.ACTIVE,
    location: "",
    description: "",
  });

  useEffect(() => {
    if (device) {
      setFormData(device);
    } else {
      setFormData({
        name: "",
        type: DeviceType.SENSOR,
        status: DeviceStatus.ACTIVE,
        location: "",
        description: "",
      });
    }
  }, [device]);

  const handleSubmit = async () => {
    try {
      if (device?.id) {
        await deviceService.updateDevice(device.id, formData);
      } else {
        await deviceService.createDevice(formData);
      }
      onSave(formData as Device);
      onClose();
    } catch (error) {
      console.error("Error saving device:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{device ? "Edit Device" : "Add Device"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}>
              {Object.values(DeviceType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as DeviceStatus,
                })
              }
            >
              {Object.values(DeviceStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
