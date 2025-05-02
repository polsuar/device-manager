import { format } from "date-fns";
import { Measurement } from "./types";

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatHour = (timestamp: number) => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}\n${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

export const formatMonthDayHour = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getLast24HDataByType = (data: Measurement[], type: string) => {
  const filtered = data.filter((m) => m.type === type);
  if (filtered.length === 0) return [];
  const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
  const lastTimestamp = sorted[sorted.length - 1].timestamp;
  const twentyFourHoursBeforeLast = lastTimestamp - 24 * 60 * 60 * 1000;
  return sorted.filter((m) => m.timestamp >= twentyFourHoursBeforeLast);
};
 