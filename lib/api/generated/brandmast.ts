import type { AxiosInstance } from "axios";
import { createBrandmastHttpClient, type RequestOptions } from "./client";
import type {
  ActionApproveRequest,
  ActionCasRequest,
  ActionIdRequest,
  CasActionChangeStatusRequest,
  ApiResponseActionConflictResponse,
  ApiResponseActionsResponse,
  ApiResponseListActionsResponse,
  ApiResponseListBrandmastersResponse,
  ApiResponseListTourPlannerBrandmasterListItem,
  ApiResponseListEvent,
  ApiResponseListShopResponse,
  ApiResponseListTourPlannerActionListItem,
  ApiResponseListTourPlannerPointListItem,
  ApiResponseTourPlannerActionCreateResult,
  ApiResponseListOneTwoOneAplikacjaZgloszenie,
  ApiResponseListOneTwoOneAwaryjneZgloszenia,
  ApiResponseListOneTwoOneRivoVirto,
  ApiResponseListOneTwoOneSampling,
  ApiResponseListOneTwoOneTeam,
  ApiResponseListBonusResponse,
  ApiResponseOneTwoOneAplikacjaZgloszenieCreated,
  ApiResponseOneTwoOnePhotoUploaded,
  ApiResponseOneTwoOneSamplingCreated,
  ApiResponseOneTwoOneZgloszenieKodMygloCreated,
  ApiResponseLoginResponse,
  BonusRequest,
  ApiResponseObject,
  ApiResponseSettingResponse,
  ActionRequest,
  BrandmasterAddRequest,
  BrandmasterDeleteRequest,
  ConfigUpdateRequest,
  CreateCasActionRequest,
  DeleteBmActionRequest,
  LoginRequest,
  PointCasRequest,
  ShopAddRequest,
  ShopDeleteRequest,
  UpdateActionRequest,
  ZgloszeniaAplikacjeAddRequest,
  ZgloszeniaSamplingAddRequest,
  ZgloszenieKodMygloAddRequest,
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
   * POST /api/action/bm/isConflict
   */
  async isBMActionConflict(body: ActionRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseActionConflictResponse>(
      "/api/action/bm/isConflict",
      body,
      options,
    );
    return res.data;
  }

  /**
   * GET /api/event/fetch
   */
  async fetchEvents(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListEvent>("/api/event/fetch", options);
    return res.data;
  }

  /**
   * GET /api/brandmaster/sv/fetch
   */
  async fetchBrandmasters(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListBrandmastersResponse>(
      "/api/brandmaster/sv/fetch",
      options,
    );
    return res.data;
  }

  /**
   * GET /api/cas/brandmaster/sv/fetch
   */
  async fetchCasBrandmasters(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListTourPlannerBrandmasterListItem>(
      "/api/cas/brandmaster/sv/fetch",
      options,
    );
    return res.data;
  }

  /**
   * POST /api/brandmaster/sv/add
   */
  async addBrandmaster(body: BrandmasterAddRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/brandmaster/sv/add", body, options);
    return res.data;
  }

  /**
   * POST /api/brandmaster/sv/delete
   */
  async deleteBrandmaster(body: BrandmasterDeleteRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>(
      "/api/brandmaster/sv/delete",
      body,
      options,
    );
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
   * GET /api/shop/fetch-top?eventId=...&limit=...
   */
  async fetchTopShops(
    params: { eventId: number; limit: number },
    options?: RequestOptions,
  ) {
    const res = await this.http.get<ApiResponseListShopResponse>("/api/shop/fetch-top", {
      ...options,
      params,
    });
    return res.data;
  }

  /**
   * POST /api/shop/sv/add
   */
  async addShop(body: ShopAddRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/shop/sv/add", body, options);
    return res.data;
  }

  /**
   * POST /api/shop/sv/delete
   */
  async deleteShop(body: ShopDeleteRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/shop/sv/delete", body, options);
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
   * GET /api/bonus/bm/fetch
   */
  async fetchBonus(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListBonusResponse>("/api/bonus/bm/fetch", options);
    return res.data;
  }

  /**
   * POST /api/bonus/bm/create
   */
  async createBonus(body: BonusRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/bonus/bm/create", body, options);
    return res.data;
  }

  /**
   * POST /api/bonus/bm/update
   */
  async updateBonus(body: BonusRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/bonus/bm/update", body, options);
    return res.data;
  }

  /**
   * POST /api/bonus/bm/delete
   */
  async deleteBonus(body: BonusRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>("/api/bonus/bm/delete", body, options);
    return res.data;
  }

  /**
   * GET /api/action/sv/fetch?month=...
   * Każda akcja w `data[].actions[]` może zawierać tablicę `cas` (CasDetails).
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
   * POST /api/cas/point/sv/fetch
   */
  async fetchSVPoints(body: PointCasRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseListTourPlannerPointListItem>(
      "/api/cas/point/sv/fetch",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/cas/action/sv/fetch
   */
  async fetchSVCasActions(body: ActionCasRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseListTourPlannerActionListItem>(
      "/api/cas/action/sv/fetch",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/cas/action/create-blank
   */
  async createBlankAction(body: CreateCasActionRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseTourPlannerActionCreateResult>(
      "/api/cas/action/create-blank",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/cas/action/sv/update-status
   */
  async updateStatus(body: CasActionChangeStatusRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseObject>(
      "/api/cas/action/sv/update-status",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/cas/action/bm/fetch
   */
  async fetchBMActions(body: ActionCasRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseListTourPlannerActionListItem>(
      "/api/cas/action/bm/fetch",
      body,
      options,
    );
    return res.data;
  }

  /**
   * GET /api/121/zgloszeniaSampling/fetch
   */
  async fetchZgloszeniaSampling(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListOneTwoOneSampling>(
      "/api/121/zgloszeniaSampling/fetch",
      options,
    );
    return res.data;
  }

  /**
   * GET /api/121/zgloszeniaAplikacje/fetch
   */
  async fetchZgloszeniaAplikacje(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListOneTwoOneAplikacjaZgloszenie>(
      "/api/121/zgloszeniaAplikacje/fetch",
      options,
    );
    return res.data;
  }

  /**
   * GET /api/121/zgloszeniaAwaryjne/fetch
   */
  async fetchZgloszeniaAwaryjne(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListOneTwoOneAwaryjneZgloszenia>(
      "/api/121/zgloszeniaAwaryjne/fetch",
      options,
    );
    return res.data;
  }

  /**
   * GET /api/121/teams/fetch
   */
  async fetchTeam(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListOneTwoOneTeam>(
      "/api/121/teams/fetch",
      options,
    );
    return res.data;
  }

  /**
   * GET /api/121/products/rivoVirto/fetch
   */
  async fetchProductsRivoVirto(options?: RequestOptions) {
    const res = await this.http.get<ApiResponseListOneTwoOneRivoVirto>(
      "/api/121/products/rivoVirto/fetch",
      options,
    );
    return res.data;
  }

  /**
   * POST /api/121/zgloszeniaSampling/add
   */
  async addZgloszeniaSampling(body: ZgloszeniaSamplingAddRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseOneTwoOneSamplingCreated>(
      "/api/121/zgloszeniaSampling/add",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/121/zgloszeniaAplikacje/add
   */
  async addZgloszeniaAplikacje(body: ZgloszeniaAplikacjeAddRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseOneTwoOneAplikacjaZgloszenieCreated>(
      "/api/121/zgloszeniaAplikacje/add",
      body,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/121/photo/add
   * multipart/form-data — pole upload[]
   */
  async add121Photo(file: File | Blob, options?: RequestOptions) {
    const formData = new FormData();
    formData.append("upload[]", file);
    const res = await this.http.post<ApiResponseOneTwoOnePhotoUploaded>(
      "/api/121/photo/add",
      formData,
      options,
    );
    return res.data;
  }

  /**
   * POST /api/121/zgloszenieKodMyglo/add
   */
  async addZgloszenieKodMyglo(body: ZgloszenieKodMygloAddRequest, options?: RequestOptions) {
    const res = await this.http.post<ApiResponseOneTwoOneZgloszenieKodMygloCreated>(
      "/api/121/zgloszenieKodMyglo/add",
      body,
      options,
    );
    return res.data;
  }

  /**
   * GET /api/excel/sv/export/brandmasters.xlsx
   */
  async exportBrandmastersExcel(options?: RequestOptions) {
    const res = await this.http.get<Blob>("/api/excel/sv/export/brandmasters.xlsx", {
      ...options,
      responseType: "blob",
    });
    return res.data;
  }

  /**
   * GET /api/excel/sv/export/actions.xlsx?startDate=...&endDate=...
   */
  async exportActionsExcel(
    params?: { startDate?: string; endDate?: string },
    options?: RequestOptions,
  ) {
    const res = await this.http.get<Blob>("/api/excel/sv/export/actions.xlsx", {
      ...options,
      params,
      responseType: "blob",
    });
    return res.data;
  }
}

export const brandmastApi = new BrandmastApi();

