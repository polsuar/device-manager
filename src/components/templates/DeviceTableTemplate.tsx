import { Box } from "@mui/material";
import { SearchPanel } from "../organisms/SearchPanel";
import { DataTable } from "../organisms/DataTable";
import { Typography } from "../atoms/Typography";
import AddIcon from "@mui/icons-material/Add";
import { ActionButton } from "../molecules/ActionButton";
import { Device } from "../../types/device";

export interface DeviceTableTemplateProps {
  devices: Device[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onAddDevice: () => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (device: Device) => void;
  onViewDevice: (device: Device) => void;
}

export const DeviceTableTemplate = ({
  devices,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
  onViewDevice,
}: DeviceTableTemplateProps) => {
  const columns = [
    { id: "name", label: "Nombre", minWidth: 170 },
    { id: "type", label: "Tipo", minWidth: 100 },
    {
      id: "status",
      label: "Estado",
      minWidth: 100,
      format: (value: string) => (value === "online" ? "En línea" : "Fuera de línea"),
    },
    {
      id: "batteryLevel",
      label: "Batería",
      minWidth: 100,
      format: (value: number) => `${value}%`,
    },
    {
      id: "signalStrength",
      label: "Señal",
      minWidth: 100,
      format: (value: number) => `${value}%`,
    },
    { id: "lastSeen", label: "Última vez", minWidth: 170 },
  ];

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

      <DataTable
        columns={columns}
        rows={devices}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        onEdit={onEditDevice}
        onDelete={onDeleteDevice}
        onView={onViewDevice}
      />
    </Box>
  );
};
