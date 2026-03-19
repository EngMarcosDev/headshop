export type AbacaxiErrorPayload = {
  title?: string;
  message: string;
};

export const notifyAbacaxiError = (payload: AbacaxiErrorPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bacaxita:error", { detail: payload }));
};
