type NetworkInfo = {
  ip?: string;
  port?: string | number;
  origin?: string;
  allIps?: string[];
};

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function pickLanIp(info?: NetworkInfo) {
  const ips = [info?.ip, ...(info?.allIps || [])].filter(Boolean) as string[];
  return ips.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172."))
    || ips[0];
}

export function buildScannerUrl({
  roomId,
  browserOrigin,
  networkInfo,
}: {
  roomId: string;
  browserOrigin: string;
  networkInfo?: NetworkInfo;
}) {
  const current = new URL(browserOrigin);
  let scannerOrigin = networkInfo?.origin || browserOrigin;

  if (isLocalHost(current.hostname)) {
    const lanIp = pickLanIp(networkInfo);
    if (lanIp) {
      const port = networkInfo?.port || current.port || "5000";
      scannerOrigin = `${current.protocol}//${lanIp}:${port}`;
    }
  }

  const url = new URL("/scanner", scannerOrigin);
  url.searchParams.set("room", roomId);
  return url.toString();
}
