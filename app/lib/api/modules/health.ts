import { api } from "../client";

export type HealthResponse = {
  ok: boolean;
};

export function getHealth() {
  return api.get<HealthResponse>("/health");
}

