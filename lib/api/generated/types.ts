/**
 * AUTO-GENERATED-ish types from provided OpenAPI components.schemas
 * (kept as plain TS interfaces for easy editing)
 */

export interface LoginRequest {
  login: string; // minLength: 1
  password?: string;
}

export interface AccountDetails {
  idAccount?: number; // int64
  login?: string;
  role?: string;
  createdAt?: string; // date-time
}

export interface LoginResponse {
  accountDetails?: AccountDetails;
  token?: string;
}

export interface Meta {
  id?: string;
  timestamp?: string;
}

export interface Violation {
  field?: string;
  message?: string;
}

export interface ApiResponseLoginResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: LoginResponse;
  violations?: Violation[];
}

export interface UpdateActionRequest {
  idAction: number; // int64
  idShop: number; // int64
  since?: string; // date-time
  until?: string; // date-time
  status?: string;
  /** Opcjonalny tytuł — jeśli backend go obsługuje przy akceptacji. */
  title?: string;
}

/** POST /api/action/sv/approve */
export interface ActionApproveRequest {
  idAction?: number; // int64
  since?: string; // date-time
  until?: string; // date-time
  title?: string;
  isActive?: boolean;
}

export interface ActionRequest {
  idAction?: number; // int64
  idShop: number; // int64
  since?: string; // date-time
  until?: string; // date-time
  status?: string;
}

/** POST /api/action/sv/cancel, POST /api/action/bm/cancel */
export interface ActionIdRequest {
  idAction?: number; // int64
}

export interface ApiResponseObject {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  // OpenAPI has `data: {}` (any object)
  data?: unknown;
  violations?: Violation[];
}

export interface Tourplanner {
  ident?: string;
  id?: string;
}

export interface Location {
  address?: string;
  geoLat?: string;
  geoLng?: string;
}

export interface Event {
  id?: number; // int64
  name?: string;
  ident?: string;
  tpEventId?: string;
}

/** GET /api/event/fetch */
export interface ApiResponseListEvent {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: Event[];
  violations?: Violation[];
}

export interface ShopResponse {
  id?: number; // int64
  name?: string;
  tourplanner?: Tourplanner;
  location?: Location;
  event?: Event;
}

/** POST /api/shop/sv/delete */
export interface ShopDeleteRequest {
  idShop?: number; // int64
}

/** POST /api/shop/sv/add */
export interface ShopAddRequest {
  tpUuid?: string;
  tpIdent?: string;
  name?: string;
  street_address?: string;
  cityName?: string;
  geoLat?: string;
  geoLng?: string;
  idEvent?: number; // int64
}

export interface ApiResponseListShopResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: ShopResponse[];
  violations?: Violation[];
}

export interface ActionsConfig {
  isEditingAllowed?: boolean;
  isAddingAllowed?: boolean;
  isDeteletingAllowed?: boolean;
  /** Poprawna nazwa pola — część backendów zwraca zamiast `isDeteletingAllowed`. */
  isDeletingAllowed?: boolean;
}

/** POST /api/action/bm/delete — ten sam kształt co `ActionIdRequest` */
export type DeleteBmActionRequest = ActionIdRequest;

export interface AccessConfig {
  isCasConnected?: boolean;
}

export interface MyData {
  requirePassword?: boolean;
  /** Present on supervisor config; may be null when unknown. */
  hasTourplanner?: boolean | null;
  hasOneTwoOne?: boolean | null;
  kasoterminal?: number | null; // int64
  casLogin?: string | null;
}

export interface AreaData {
  id?: number; // int64
  tpUuid?: string;
  ident?: string;
}

export interface TerritoryData {
  id?: number; // int64
  tpUuid?: string;
  ident?: string;
  areaData?: AreaData;
}

export interface TeamData {
  id?: number; // int64
  territoryData?: TerritoryData;
}

export interface BrandmasterData {
  id?: number; // int64
  name?: string;
  surname?: string;
  login?: string;
  mail?: string;
}

export interface SettingResponse {
  id?: number; // int64
  brandmasterData?: BrandmasterData;
  teamData?: TeamData;
  actionsConfig?: ActionsConfig;
  accessConfig?: AccessConfig;
  myData?: MyData;
}

/** Body for POST /api/config/update (partial updates: only non-null fields are applied server-side). */
export interface ConfigUpdateRequest {
  isEditingAllowed?: boolean;
  isAddingAllowed?: boolean;
  isDeletingAllowed?: boolean;
  /** Matches typo in ActionsConfig / some backends. */
  isDeteletingAllowed?: boolean;
  casLogin?: string | null;
  casPassword?: string | null;
  requirePassword?: boolean;
  password?: string;
  oneTwoOnePassword?: string;
  kasoterminalNr?: number; // int64
}

export interface ApiResponseSettingResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: SettingResponse;
  violations?: Violation[];
}

export interface ShopDetails {
  idShop?: number; // int64
  name?: string;
  address?: string;
  geoLat?: string;
  geoLng?: string;
  tpShopId?: string;
  tpIdent?: string;
}

export interface EventDetails {
  idEvent?: number; // int64
  name?: string;
  tpEventId?: string;
}

export interface ActionDetails {
  idAction?: number; // int64
  status?: string;
  since?: string; // date-time
  until?: string; // date-time
  createdAt?: string; // date-time
  updatedAt?: string; // date-time
  shop?: ShopDetails;
  event?: EventDetails;
}

export interface BrandmasterDetails {
  idBrandmaster?: number; // int64
  name?: string;
  surname?: string;
  account?: AccountDetails;
}

export interface ActionsResponse {
  brandmaster?: BrandmasterDetails;
  actions?: ActionDetails[];
}

export interface ApiResponseActionsResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: ActionsResponse;
  violations?: Violation[];
}

export interface ApiResponseListActionsResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: ActionsResponse[];
  violations?: Violation[];
}

/** POST /api/cas/point/sv/fetch */
export interface PointCasRequest {
  idEvent: number; // int64
}

/** POST /api/cas/action/sv/fetch, POST /api/cas/action/bm/fetch */
export interface ActionCasRequest {
  idEvent?: number; // int64
  since: string; // date
  until: string; // date
  status?: string;
}

export interface TourPlannerPointListAddress {
  streetAddress?: string;
  cityName?: string;
  geoLat?: string;
  geoLng?: string;
}

export interface TourPlannerPointListItem {
  uuid?: string;
  ident?: string;
  name?: string;
  address?: TourPlannerPointListAddress;
}

export interface ApiResponseListTourPlannerPointListItem {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: TourPlannerPointListItem[];
  violations?: Violation[];
}

export interface CasAddressCreate {
  streetAddress?: string;
  streetNumber?: string;
  cityName?: string;
  postalCode?: string;
  geoLat?: string;
  geoLng?: string;
}

export interface CasDatetimeBlock {
  date?: string;
  timezone_type?: number; // int32
  timezone?: string;
}

export interface CasIdentifiedRef {
  uuid?: string;
  ident?: string;
}

export interface TourPlannerActionListBrandmaster {
  uuid?: string;
  ident?: string;
  firstname?: string;
  lastname?: string;
}

export interface TourPlannerActionListEvent {
  uuid?: string;
  ident?: string;
  name?: string;
}

export interface TourPlannerActionListHistory {
  start?: CasDatetimeBlock;
  stop?: CasDatetimeBlock;
  totalTime?: string;
}

export interface TourPlannerActionListPoint {
  uuid?: string;
  name?: string;
  address?: CasAddressCreate;
}

export interface TourPlannerActionListItem {
  uuid?: string;
  ident?: string;
  name?: string;
  since?: string;
  until?: string;
  startLat?: string;
  startLng?: string;
  area?: CasIdentifiedRef;
  event?: TourPlannerActionListEvent;
  territory?: CasIdentifiedRef;
  status?: string;
  brandmaster?: TourPlannerActionListBrandmaster;
  point?: TourPlannerActionListPoint;
  history?: TourPlannerActionListHistory;
}

export interface ApiResponseListTourPlannerActionListItem {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: TourPlannerActionListItem[];
  violations?: Violation[];
}

