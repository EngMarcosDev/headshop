export type AbacaxiEventLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type AbacaxiErrorPayload = {
  title?: string;
  message: string;
  level?: AbacaxiEventLevel;
  iconKey?: string;
};

export const notifyAbacaxiEvent = (payload: AbacaxiErrorPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bacaxita:error", { detail: payload }));
};

export const notifyAbacaxiError = (payload: AbacaxiErrorPayload) => {
  notifyAbacaxiEvent({
    level: payload.level || "ERROR",
    iconKey: payload.iconKey || "icon_confuso",
    title: payload.title,
    message: payload.message,
  });
};
