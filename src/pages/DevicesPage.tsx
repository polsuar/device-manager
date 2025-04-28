import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { DeviceListTemplate,  } from "../components/templates/DeviceListTemplate";
import { DeviceTableTemplate } from "../components/templates/DeviceTableTemplate";
import { useNavigate } from "react-router-dom";
import { Device } from "../types/device";

// Datos de ejemplo
const mockDevices: Device[] = [
  {
    id: "1",
    name: "Sensor de Temperatura 1",
    type: "sensor",
    status: "online",
    batteryLevel: 85,
    signalStrength: 90,
    lastSeen: "",
    userId: "",
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "2",
    name: "Cámara de Seguridad 1",
    type: "camera",
    status: "offline",
    batteryLevel: 15,
    signalStrength: 45,
    lastSeen: "",
    userId: "",
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "3",
    name: "Gateway Principal",
    type: "gateway",
    status: "online",
    batteryLevel: 100,
    signalStrength: 95,
    lastSeen: "",
    userId: "",
    createdAt: "",
    updatedAt: ""
  },
];

export const DevicesPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleAddDevice = () => {
    // TODO: Implementar lógica para agregar dispositivo
    console.log("Agregar dispositivo");
  };

  const handleEditDevice = (id: string) => {
    // TODO: Implementar lógica para editar dispositivo
    console.log("Editar dispositivo:", id);
  };

  const handleDeleteDevice = (id: string) => {
    // TODO: Implementar lógica para eliminar dispositivo
    console.log("Eliminar dispositivo:", id);
  };

  const handleViewDevice = (device: Device) => {
    navigate(`/devices/${device.id}`);
  };

  const filteredDevices = mockDevices.filter((device) => {
    const matchesSearch = device.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = !statusFilter || device.status === statusFilter;
    const matchesType = !typeFilter || device.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, newMode) => newMode && setViewMode(newMode)}>
          <ToggleButton value="list">Lista</ToggleButton>
          <ToggleButton value="table">Tabla</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === "list" ? (
        <DeviceListTemplate
          devices={filteredDevices}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onAddDevice={handleAddDevice}
          onEditDevice={(device) => handleEditDevice(device.id)}
          onDeleteDevice={(device) => handleDeleteDevice(device.id)}
        />
      ) : (
        <DeviceTableTemplate
          devices={filteredDevices}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          page={page}
          rowsPerPage={rowsPerPage}
          totalRows={filteredDevices.length}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onAddDevice={handleAddDevice}
          onEditDevice={(device) => handleEditDevice(device.id)}
          onDeleteDevice={(device) => handleDeleteDevice(device.id)}
          onViewDevice={handleViewDevice}
        />
      )}
    </Box>
  );
};
