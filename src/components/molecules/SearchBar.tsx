import { Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { TextField } from "../atoms/TextField";
import { Icon } from "../atoms/Icon";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

export const SearchBar = ({ value, onChange, placeholder = "Buscar...", fullWidth = true }: SearchBarProps) => {
  return (
    <Box sx={{ position: "relative", width: fullWidth ? "100%" : "auto" }}>
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        fullWidth={fullWidth}
        InputProps={{
          startAdornment: <Icon component={SearchIcon} sx={{ mr: 1, color: "text.secondary" }} size="small" />,
        }}
      />
    </Box>
  );
};
