import { Box, Grid } from "@mui/material";
import { Card } from "../atoms/Card";
import { CardHeader } from "../molecules/CardHeader";
import { ActionButton } from "../molecules/ActionButton";
import { Typography } from "../atoms/Typography";
import DeviceIcon from "@mui/icons-material/Devices";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BatteryIcon from "@mui/icons-material/BatteryFull";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";

export interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline";
  batteryLevel: number;
  signalStrength: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DeviceCard = ({ id, name, type, status, batteryLevel, signalStrength, onEdit, onDelete }: DeviceCardProps) => {
  return (
    <Card>
      <CardHeader
        title={name}
        icon={DeviceIcon}
        subtitle={type}
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <ActionButton icon={EditIcon} label="Editar" onClick={() => onEdit(id)} variant="outline" size="small" />
            <ActionButton icon={DeleteIcon} label="Eliminar" onClick={() => onDelete(id)} variant="outline" size="small" color="error" />
          </Box>
        }
      />
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BatteryIcon color={batteryLevel > 20 ? "success" : "error"} />
            <Typography variant="body2">{batteryLevel}% batería</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SignalCellularAltIcon color={status === "online" ? "success" : "error"} />
            <Typography variant="body2">{status === "online" ? "En línea" : "Fuera de línea"}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};
