import { Typography as MuiTypography, TypographyProps as MuiTypographyProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface TypographyProps extends MuiTypographyProps {
  weight?: "light" | "regular" | "medium" | "bold";
}

const StyledTypography = styled(MuiTypography)<TypographyProps>(({ theme, weight = "regular" }) => ({
  fontWeight: weight === "light" ? 300 : weight === "regular" ? 400 : weight === "medium" ? 500 : 700,
}));

export const Typography = ({ children, ...props }: TypographyProps) => {
  return <StyledTypography {...props}>{children}</StyledTypography>;
};
