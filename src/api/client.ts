const isPrivateHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host.startsWith("192.168.") ||
  host.startsWith("10.") ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

const getWindowProtocol = () => (window.location.protocol === "https:" ? "https:" : "http:");

const resolveDefaultApiBase = () => {
  if (typeof window === "undefined") return "/api/headshop";
  const host = window.location.hostname;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  ) {
    return "http://localhost:5050/api/headshop";
  }
  if (host.endsWith("bacaxita.com.br")) {
    return `https://${host}/api/headshop`;
  }
  return "/api/headshop";
};

const resolveDefaultErpApiBase = () => {
  if (typeof window === "undefined") return "http://localhost:5050/api/erp";
  const host = window.location.hostname;
  const protocol = getWindowProtocol();
  if (isPrivateHost(host)) {
    return `${protocol}//${host}:5050/api/erp`;
  }
  if (host.endsWith("bacaxita.com.br")) {
    return `${protocol}//${window.location.host}/api/erp`;
  }
  return "/api/erp";
};

const normalizeConfiguredBase = (configuredBase: string | undefined, fallbackBase: string) => {
  const normalized = (configuredBase || "").trim();
  if (!normalized) return fallbackBase;

  if (typeof window === "undefined") return normalized;
  if (!/^https?:\/\//i.test(normalized)) return normalized;

  try {
    const parsed = new URL(normalized);
    const browserHost = window.location.hostname;
    const browserProtocol = getWindowProtocol();
    const fromLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (fromLocalhost && browserHost.endsWith("bacaxita.com.br")) {
      return `${browserProtocol}//${window.location.host}${parsed.pathname}`;
    }

    if (fromLocalhost && isPrivateHost(browserHost)) {
      parsed.hostname = browserHost;
      parsed.protocol = browserProtocol;
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return normalized;
  }

  return normalized.replace(/\/$/, "");
};

export const API_BASE = normalizeConfiguredBase(
  import.meta.env.VITE_API_URL,
  resolveDefaultApiBase()
);
export const ERP_API_BASE = normalizeConfiguredBase(
  import.meta.env.VITE_ERP_API_URL,
  resolveDefaultErpApiBase()
);
export const USE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === "true";

export const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const DEFAULT_TIMEOUT_MS = 10000;

export async function apiGetWithBase<T>(
  base: string,
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const url = joinUrl(base, path);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiGetWithBase<T>(API_BASE, path, timeoutMs);
}
