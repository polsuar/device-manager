import { Typography as MuiTypography, TypographyProps as MuiTypographyProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface TypographyProps extends MuiTypographyProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2" | "caption";
  color?: "primary" | "secondary" | "text" | "error" | "success" | "warning";
  weight?: "light" | "regular" | "medium" | "bold";
}

const StyledTypography = styled(MuiTypography)<TypographyProps>(({ theme, variant = "body1", color = "text", weight = "regular" }) => ({
  ...(variant.startsWith("h") && {
    fontWeight: 600,
    lineHeight: 1.2,
  }),
  ...(color === "primary" && {
    color: theme.palette.primary.main,
  }),
  ...(color === "secondary" && {
    color: theme.palette.secondary.main,
  }),
  ...(color === "error" && {
    color: theme.palette.error.main,
  }),
  ...(color === "success" && {
    color: theme.palette.success.main,
  }),
  ...(color === "warning" && {
    color: theme.palette.warning.main,
  }),
  ...(weight === "light" && {
    fontWeight: 300,
  }),
  ...(weight === "regular" && {
    fontWeight: 400,
  }),
  ...(weight === "medium" && {
    fontWeight: 500,
  }),
  ...(weight === "bold" && {
    fontWeight: 700,
  }),
}));

export const Typography = ({ children, ...props }: TypographyProps) => {
  return <StyledTypography {...props}>{children}</StyledTypography>;
};
