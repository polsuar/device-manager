import { Box } from "@mui/material";
import { Typography } from "../atoms/Typography";
import { Icon } from "../atoms/Icon";
import { SvgIconComponent } from "@mui/icons-material";

export interface CardHeaderProps {
  title: string;
  icon?: SvgIconComponent;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({ title, icon, subtitle, action }: CardHeaderProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      {icon && <Icon component={icon} sx={{ mr: 1, color: "primary.main" }} size="medium" />}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" weight="medium">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
};
