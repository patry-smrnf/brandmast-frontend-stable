import { apiFetch, type ApiFetchOptions } from "@/lib/api/http";

export type ApiClient = {
  get: <T>(path: string, options?: ApiFetchOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, options?: ApiFetchOptions) => Promise<T>;
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) => Promise<T>;
  del: <T>(path: string, options?: ApiFetchOptions) => Promise<T>;
};

export const api: ApiClient = {
  get: (path, options) => apiFetch(path, { ...options, method: "GET" }),
  post: (path, body, options) => apiFetch(path, { ...options, method: "POST", body }),
  put: (path, body, options) => apiFetch(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: "PATCH", body }),
  del: (path, options) => apiFetch(path, { ...options, method: "DELETE" }),
};

