import { SvgIconProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { SvgIconComponent } from "@mui/icons-material";

export interface IconProps extends SvgIconProps {
  component: SvgIconComponent;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success" | "inherit";
  size?: "small" | "medium" | "large";
}

const StyledIcon = styled("span")<IconProps>(({ theme, color = "inherit", size = "medium" }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  ...(color !== "inherit" && {
    color: theme.palette[color].main,
  }),
  ...(size === "small" && {
    fontSize: "1.25rem",
  }),
  ...(size === "medium" && {
    fontSize: "1.5rem",
  }),
  ...(size === "large" && {
    fontSize: "2rem",
  }),
}));

export const Icon = ({ component: Component, ...props }: IconProps) => {
  return (
    <StyledIcon {...props}>
      <Component />
    </StyledIcon>
  );
};
