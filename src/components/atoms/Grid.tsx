import { Grid as MuiGrid, GridProps as MuiGridProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface GridProps extends MuiGridProps {
  component?: React.ElementType;
}

const StyledGrid = styled(MuiGrid)<GridProps>(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  margin: theme.spacing(-1),
  "& > *": {
    padding: theme.spacing(1),
  },
}));

export const Grid = ({ children, ...props }: GridProps) => {
  return <StyledGrid {...props}>{children}</StyledGrid>;
};
