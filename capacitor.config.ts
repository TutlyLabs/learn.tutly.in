import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tutly.app",
  appName: "tutly",
  webDir: "dist",
  server: {
    url: "http://192.168.2.1:4321",
    cleartext: false,
  },
};

export default config;
