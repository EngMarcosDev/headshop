import { apiGet } from "./client";

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
}

export async function fetchSitePopups(): Promise<SitePopup[]> {
  try {
    const payload = await apiGet<SitePopup[]>("/site/popups");
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}
