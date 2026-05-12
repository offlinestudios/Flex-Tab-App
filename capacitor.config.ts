import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.offlinestudios.flextab",
  appName: "FlexTab",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
