import type { AxiosInstance } from "axios";
import { createBrandmastHttpClient, type RequestOptions } from "./client";
import type {
  ActionApproveRequest,
  ActionCasRequest,
  ActionIdRequest,
  ApiResponseActionsResponse,
  ApiResponseListActionsResponse,
  ApiResponseListShopResponse,
  ApiResponseListTourPlannerActionListItem,
  ApiResponseLoginResponse,
  ApiResponseObject,
  ApiResponseSettingResponse,
  ActionRequest,
  ConfigUpdateRequest,
  DeleteBmActionRequest,
  LoginRequest,
  ShopIdRequest,
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
   * POST /api/action/sv/approve
   */
  async approveSvAction(body: ActionApproveRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/sv/approve", body, options);
    return res.data;
  }

  /**
   * POST /api/action/sv/cancel
   */
  async cancelSvAction(body: ActionIdRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/sv/cancel", body, options);
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
   * POST /api/action/bm/delete
   */
  async deleteBmAction(body: DeleteBmActionRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/bm/delete", body, options);
    return res.data;
  }

  /**
   * POST /api/action/bm/cancel
   */
  async cancelBMAction(body: ActionIdRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/action/bm/cancel", body, options);
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
   * POST /api/shop/delete
   */
  async deleteShop(body: ShopIdRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/shop/delete", body, options);
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
   * POST /api/config/update
   */
  async updateConfig(body: ConfigUpdateRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/config/update", body, options);
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

  /**
   * POST /api/cas/sv/fetch
   */
  async fetchSVActions(body: ActionCasRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseListTourPlannerActionListItem>(
      "/api/cas/sv/fetch",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/cas/bm/fetch
   */
  async fetchBMActions(body: ActionCasRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseListTourPlannerActionListItem>(
      "/api/cas/bm/fetch",
      body,
      options,
    );
    return res.data;
  }
}

export const brandmastApi = new BrandmastApi();

