import { Box, Grid } from "@mui/material";
import { SearchPanel } from "../organisms/SearchPanel";
import { DeviceCard } from "../organisms/DeviceCard";
import { Typography } from "../atoms/Typography";
import AddIcon from "@mui/icons-material/Add";
import { ActionButton } from "../molecules/ActionButton";
import { Device } from "../../types/device";

export interface DeviceListTemplateProps {
  devices: Device[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onAddDevice: () => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (device: Device) => void;
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
            <DeviceCard
              id={device.id}
              name={device.name}
              type={device.type}
              status={device.status}
              batteryLevel={device.batteryLevel}
              signalStrength={device.signalStrength}
              onEdit={() => onEditDevice(device)}
              onDelete={() => onDeleteDevice(device)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
