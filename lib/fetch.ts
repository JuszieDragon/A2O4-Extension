export function constructBaseUrl(ip: (string | null), port: (string | null)): string {
  if (port == "0") {
    return ip;
  } else {
    return `${ip}:${port}`;
  }
}
