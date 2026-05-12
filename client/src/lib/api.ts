const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || "https://www.flextab.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PUBLIC_APP_URL;

const isNativeShell = () =>
  typeof window !== "undefined" &&
  (window.location.protocol === "capacitor:" || window.location.protocol === "ionic:");

const currentOrigin = () =>
  typeof window !== "undefined" && !isNativeShell() ? window.location.origin : API_BASE_URL;

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
};

export const publicAppUrl = (path = "") => {
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  return `${PUBLIC_APP_URL.replace(/\/$/, "")}${normalizedPath}`;
};

export const appOrigin = () => currentOrigin().replace(/\/$/, "");

export const canUseServiceWorker = () =>
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  typeof window !== "undefined" &&
  window.location.protocol.startsWith("http");
