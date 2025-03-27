import { Box, FormControl, InputLabel, Select, MenuItem, Grid } from "@mui/material";
import { SearchBar } from "../molecules/SearchBar";
import { Typography } from "../atoms/Typography";

export interface SearchPanelProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
}

export const SearchPanel = ({ searchValue, onSearchChange, statusFilter, onStatusFilterChange, typeFilter, onTypeFilterChange }: SearchPanelProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" weight="medium" sx={{ mb: 2 }}>
        Búsqueda y Filtros
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <SearchBar value={searchValue} onChange={onSearchChange} placeholder="Buscar dispositivos..." />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select value={statusFilter} label="Estado" onChange={(e) => onStatusFilterChange(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="online">En línea</MenuItem>
              <MenuItem value="offline">Fuera de línea</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select value={typeFilter} label="Tipo" onChange={(e) => onTypeFilterChange(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="sensor">Sensor</MenuItem>
              <MenuItem value="camera">Cámara</MenuItem>
              <MenuItem value="gateway">Gateway</MenuItem>
              <MenuItem value="controller">Controlador</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};
