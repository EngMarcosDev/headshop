import { apiGet, apiGetWithBase, ERP_API_BASE } from "./client";

export type SitePopupType = "FIRST" | "ALERT" | "NEWS";
export type SitePopupLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface SitePopup {
  id: number;
  type: SitePopupType;
  level: SitePopupLevel;
  title: string;
  message: string;
  imageUrl?: string | null;
  iconKey?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  dismissible: boolean;
  displaySeconds?: number | null;
  priority: number;
  updatedAt?: string;
}

const normalizePopupList = (payload: unknown): SitePopup[] => (Array.isArray(payload) ? payload : []);

export async function fetchSitePopups(): Promise<SitePopup[]> {
  try {
    const payload = await apiGet<SitePopup[]>("/site/popups");
    const normalized = normalizePopupList(payload);
    if (normalized.length > 0) return normalized;
  } catch {
    // fallback below
  }

  try {
    const payload = await apiGetWithBase<SitePopup[]>(ERP_API_BASE, "/site/popups");
    return normalizePopupList(payload);
  } catch {
    return [];
  }
}
