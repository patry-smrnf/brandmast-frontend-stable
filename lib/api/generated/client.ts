import axios, { isAxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import { getBrowserApiBaseUrl } from "@/lib/api/base-url";
import { clearSessionAndRedirectToLogin, tokenStore } from "../token";

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

function isAuthLoginRequest(config: AxiosRequestConfig | undefined) {
  const url = config?.url ?? "";
  return url.includes("/api/auth/login");
}

function getErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const code = (data as { errorCode?: unknown }).errorCode;
  return typeof code === "string" ? code : undefined;
}

function shouldForceLogout(errorCode: string | undefined, status: number | undefined) {
  if (errorCode === "auth.unauthorized") return true;
  if (status === 401) return true;
  return false;
}

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
    (response) => {
      // Some endpoints return HTTP 200 with `{ success: false, errorCode: "auth.unauthorized" }`.
      if (!isAuthLoginRequest(response.config)) {
        const data = response.data as { success?: boolean; errorCode?: string } | undefined;
        if (data && data.success === false && shouldForceLogout(data.errorCode, response.status)) {
          clearSessionAndRedirectToLogin();
        }
      }
      return response;
    },
    (error: unknown) => {
      if (isAxiosError(error) && !isAuthLoginRequest(error.config)) {
        const status = error.response?.status;
        const errorCode = getErrorCode(error.response?.data);
        if (shouldForceLogout(errorCode, status)) {
          clearSessionAndRedirectToLogin();
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
