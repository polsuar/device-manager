import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface TextFieldProps extends MuiTextFieldProps {
  variant?: "outlined" | "filled" | "standard";
  size?: "small" | "medium";
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
}

const StyledTextField = styled(MuiTextField)<TextFieldProps>(({ theme, variant = "outlined" }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiFilledInput-root": {
    borderRadius: 8,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  "& .MuiInputBase-root": {
    fontSize: "1rem",
  },
  "& .MuiInputLabel-root": {
    fontSize: "1rem",
  },
  "& .MuiHelperText-root": {
    marginLeft: 0,
    marginTop: 4,
  },
}));

export const TextField = ({ children, ...props }: TextFieldProps) => {
  return <StyledTextField {...props}>{children}</StyledTextField>;
};
