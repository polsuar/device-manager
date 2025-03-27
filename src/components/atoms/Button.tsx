import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface ButtonProps extends MuiButtonProps {
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, variant = "primary" }) => ({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 500,
  ...(variant === "primary" && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(variant === "secondary" && {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),
  ...(variant === "outline" && {
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      borderColor: theme.palette.primary.dark,
    },
  }),
}));

export const Button = ({ children, ...props }: ButtonProps) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};
