import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { ZoomIn as ZoomInIcon } from "@mui/icons-material";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  chartId: string;
  onExpand: (chartId: string) => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, chartId, onExpand }) => (
  <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 1, boxShadow: 1 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <IconButton onClick={() => onExpand(chartId)}>
        <ZoomInIcon />
      </IconButton>
    </Box>
    {children}
  </Box>
);
