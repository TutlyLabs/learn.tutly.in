import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tutly.app",
  appName: "tutly",
  webDir: "dist",
  server: {
    url: "https://learn.tutly.in",
    cleartext: false,
  },
};

export default config;
