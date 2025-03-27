import { Card as MuiCard, CardProps as MuiCardProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface CardProps extends MuiCardProps {
  variant?: "elevation" | "outlined";
  padding?: "none" | "small" | "medium" | "large";
}

const StyledCard = styled(MuiCard)<CardProps>(({ theme, padding = "medium" }) => ({
  borderRadius: 12,
  boxShadow: theme.shadows[2],
  ...(padding === "none" && {
    padding: 0,
  }),
  ...(padding === "small" && {
    padding: theme.spacing(1),
  }),
  ...(padding === "medium" && {
    padding: theme.spacing(2),
  }),
  ...(padding === "large" && {
    padding: theme.spacing(3),
  }),
}));

export const Card = ({ children, ...props }: CardProps) => {
  return <StyledCard {...props}>{children}</StyledCard>;
};
