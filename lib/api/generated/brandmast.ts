import type { AxiosInstance } from "axios";
import { createBrandmastHttpClient, type RequestOptions } from "./client";
import type {
  ApiResponseActionsResponse,
  ApiResponseListActionsResponse,
  ApiResponseListShopResponse,
  ApiResponseLoginResponse,
  ApiResponseObject,
  ApiResponseSettingResponse,
  ActionRequest,
  LoginRequest,
  UpdateActionRequest,
} from "./types";

export class BrandmastApi {
  private readonly http: AxiosInstance;

  constructor(http?: AxiosInstance) {
    this.http = http ?? createBrandmastHttpClient();
  }

  /**
   * POST /api/auth/login
   * Proba zalogowania, tylko login jest wymagany
   */
  async login(body: LoginRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseLoginResponse>("/api/auth/login", body, options);
    return res.data;
  }

  /**
   * POST /api/action/sv/update
   */
  async updateSvAction(body: UpdateActionRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/sv/update", body, options);
    return res.data;
  }

  /**
   * POST /api/action/bm/update
   */
  async updateAction(body: UpdateActionRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/bm/update", body, options);
    return res.data;
  }

  /**
   * POST /api/action/bm/add
   */
  async addBMAction(body: ActionRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/bm/add", body, options);
    return res.data;
  }

  /**
   * GET /api/shop/fetch
   */
  async fetchShops(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListShopResponse>("/api/shop/fetch", options);
    return res.data;
  }

  /**
   * GET /api/config/fetch
   */
  async fetchConfig(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseSettingResponse>("/api/config/fetch", options);
    return res.data;
  }

  /**
   * GET /api/action/sv/fetch?month=...
   */
  async fetchSvActions(params?: { month?: string }, options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListActionsResponse>("/api/action/sv/fetch", {
      ...options,
      params,
    });
    return res.data;
  }

  /**
   * GET /api/action/bm/fetch?month=...
   */
  async fetchBmActions(params?: { month?: string }, options?: RequestOptions) {
    const res = await this.http.get<ApiResponseActionsResponse>("/api/action/bm/fetch", {
      ...options,
      params,
    });
    return res.data;
  }
}

export const brandmastApi = new BrandmastApi();

