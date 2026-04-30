import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
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

function getDefaultBaseUrl() {
  // If you want to call backend directly from the browser, set this in `.env.local`.
  const direct = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (direct && direct.length > 0) return direct;
  // Fallback (works only if backend is reachable from browser at this URL)
  return "http://localhost:8081";
}

export function createBrandmastHttpClient(opts: ApiClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: opts.baseURL ?? getDefaultBaseUrl(),
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

  return instance;
}

