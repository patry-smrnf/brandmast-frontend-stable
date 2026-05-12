import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { signalBackendTimeout } from "@/lib/api/backend-timeout-signal";
import { getBrowserApiBaseUrl } from "@/lib/api/base-url";
import { tokenStore } from "../token";

export type ApiClientOptions = {
  /**
   * Override base URL for all API calls.
   */
  baseURL?: string;
  /**
   * Optional token getter override (useful for server components, tests, etc.)
   */
  getToken?: () => string | null;
};

export type RequestOptions = AxiosRequestConfig & {
  /**
   * If provided, this token wins over getToken().
   * Useful when you have a token in memory for one request.
   */
  token?: string | null;
};

export function createBrandmastHttpClient(opts: ApiClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: opts.baseURL ?? getBrowserApiBaseUrl(),
    timeout: 15_000,
    withCredentials: true,
  });

  const getToken = opts.getToken ?? (() => tokenStore.get());

  instance.interceptors.request.use((config) => {
    const maybeToken = (config as unknown as RequestOptions).token ?? getToken() ?? null;

    if (maybeToken) {
      config.headers = config.headers ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config.headers as any).Authorization = `Bearer ${maybeToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const msg = (error.message ?? "").toLowerCase();
        if (error.code === "ECONNABORTED" || msg.includes("timeout")) {
          signalBackendTimeout();
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

