import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { getFirebaseInstance } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { CircularProgress, Typography, Box, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

interface AccelData {
  x: number;
  y: number;
  z: number;
}

const Fallcare3DPage: React.FC = () => {
  const [devices, setDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [data, setData] = useState<AccelData[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Cargar lista de devices
  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);
      try {
        const { db } = getFirebaseInstance("FALLCARE");
        const devicesSnap = await getDocs(collection(db, "devices"));
        const ids = devicesSnap.docs.map((doc) => doc.id);
        console.log("Devices encontrados:", ids);
        setDevices(ids);
        if (ids.length > 0) setSelectedDevice(ids[0]);
      } catch (err) {
        console.error("Error obteniendo devices:", err);
        setDevices([]);
      }
      setLoadingDevices(false);
    };
    fetchDevices();
  }, []);

  // Cargar datos de acelerómetro del device seleccionado
  useEffect(() => {
    if (!selectedDevice) return;
    const fetchAccelData = async () => {
      setLoadingData(true);
      try {
        const { db } = getFirebaseInstance("FALLCARE");
        // Hardcodear el timestampId para la prueba
        const timestampIds = ["1731497662740"];
        let allData: AccelData[] = [];
        for (const tsId of timestampIds) {
          const subColSnap = await getDocs(collection(db, `devices/${selectedDevice}/${tsId}`));
          for (const dataDoc of subColSnap.docs) {
            const docData = dataDoc.data();
            console.log("randomId:", dataDoc.id);
            console.log("data field:", docData.data);
            if (Array.isArray(docData.data)) {
              allData = allData.concat(docData.data.map((d: any) => ({ x: d.x, y: d.y, z: d.z })));
            }
          }
        }
        setData(allData);
      } catch (err) {
        setData([]);
      }
      setLoadingData(false);
    };
    fetchAccelData();
  }, [selectedDevice]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gráfico 3D de acelerómetro (x, y, z)
      </Typography>
      {loadingDevices ? (
        <CircularProgress />
      ) : devices.length === 0 ? (
        <Typography>No hay devices.</Typography>
      ) : (
        <FormControl sx={{ minWidth: 240, mb: 3 }}>
          <InputLabel id="device-select-label">Device</InputLabel>
          <Select labelId="device-select-label" value={selectedDevice} label="Device" onChange={(e) => setSelectedDevice(e.target.value)}>
            {devices.map((id) => (
              <MenuItem key={id} value={id}>
                {id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {loadingData ? (
        <CircularProgress />
      ) : !data.length ? (
        <Typography>No hay datos de acelerómetro para este device.</Typography>
      ) : (
        <Plot
          data={[
            {
              x: data.map((d) => d.x),
              y: data.map((d) => d.y),
              z: data.map((d) => d.z),
              mode: "markers",
              type: "scatter3d",
              marker: { size: 3, color: "#1976d2" },
            },
          ]}
          layout={{
            width: 800,
            height: 600,
            title: "Acelerómetro 3D",
            scene: {
              xaxis: { title: "X" },
              yaxis: { title: "Y" },
              zaxis: { title: "Z" },
            },
          }}
        />
      )}
    </Box>
  );
};

export default Fallcare3DPage;
