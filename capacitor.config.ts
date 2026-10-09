import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.offlinestudios.flextab",
  appName: "FlexTab",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "never",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
