import { Capacitor } from "@capacitor/core";

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || "https://www.flextab.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PUBLIC_APP_URL;

export const isNativeShell = () => Capacitor.isNativePlatform();

const currentOrigin = () =>
  typeof window !== "undefined" && !isNativeShell() ? window.location.origin : API_BASE_URL;

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${(import.meta.env.VITE_API_BASE_URL || currentOrigin()).replace(/\/$/, "")}${normalizedPath}`;
};

export const publicAppUrl = (path = "") => {
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  return `${PUBLIC_APP_URL.replace(/\/$/, "")}${normalizedPath}`;
};

export const appOrigin = () => currentOrigin().replace(/\/$/, "");

export const canUseServiceWorker = () =>
  !isNativeShell() &&
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  typeof window !== "undefined" &&
  window.location.protocol.startsWith("http");
