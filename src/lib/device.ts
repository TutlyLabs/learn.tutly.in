export function extractDeviceLabel(userAgent: string): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  // Mobile devices
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android") && ua.includes("mobile")) return "Android Phone";
  if (ua.includes("android")) return "Android Device";

  // Desktop OS
  if (ua.includes("windows")) {
    const version = ua.match(/windows nt (\d+\.\d+)/)?.[1];
    if (version) {
      const versions: Record<string, string> = {
        "10.0": "Windows 10",
        "6.3": "Windows 8.1",
        "6.2": "Windows 8",
        "6.1": "Windows 7",
        "6.0": "Windows Vista",
      };
      return versions[version] || "Windows";
    }
    return "Windows";
  }

  if (ua.includes("macintosh") || ua.includes("mac os x")) return "macOS";
  if (ua.includes("linux")) return "Linux";

  // Browsers (if OS not detected)
  if (ua.includes("firefox")) return "Firefox Browser";
  if (ua.includes("chrome")) return "Chrome Browser";
  if (ua.includes("safari")) return "Safari Browser";
  if (ua.includes("edge")) return "Edge Browser";

  return "Unknown Device";
}
