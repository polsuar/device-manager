import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { SvgIconComponent } from "@mui/icons-material";

export interface ActionButtonProps {
  icon: SvgIconComponent;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
}

export const ActionButton = ({ icon, label, onClick, variant = "primary", size = "medium", disabled = false, loading = false }: ActionButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      startIcon={<Icon component={icon} size={size === "small" ? "small" : "medium"} />}
    >
      {label}
    </Button>
  );
};
