import { Box, Grid } from "@mui/material";
import { SearchPanel } from "../organisms/SearchPanel";
import { DeviceCard } from "../organisms/DeviceCard";
import { Typography } from "../atoms/Typography";
import AddIcon from "@mui/icons-material/Add";
import { ActionButton } from "../molecules/ActionButton";

export interface Device {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline";
  batteryLevel: number;
  signalStrength: number;
}

export interface DeviceListTemplateProps {
  devices: Device[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onAddDevice: () => void;
  onEditDevice: (id: string) => void;
  onDeleteDevice: (id: string) => void;
}

export const DeviceListTemplate = ({
  devices,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
}: DeviceListTemplateProps) => {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" weight="bold">
          Dispositivos
        </Typography>
        <ActionButton icon={AddIcon} label="Agregar Dispositivo" onClick={onAddDevice} variant="primary" />
      </Box>

      <SearchPanel
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        typeFilter={typeFilter}
        onTypeFilterChange={onTypeFilterChange}
      />

      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} sm={6} md={4} key={device.id}>
            <DeviceCard {...device} onEdit={onEditDevice} onDelete={onDeleteDevice} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
