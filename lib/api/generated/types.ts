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

export interface ActionRequest {
  idAction?: number; // int64
  idShop: number; // int64
  since?: string; // date-time
  until?: string; // date-time
  status?: string;
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

export interface ShopResponse {
  id?: number; // int64
  name?: string;
  tourplanner?: Tourplanner;
  location?: Location;
  event?: Event;
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
}

export interface AccessConfig {
  isCasConnected?: boolean;
}

export interface MyData {
  requirePassword?: boolean;
  hasTourplanner?: boolean;
  hasOneTwoOne?: boolean;
  kasoterminal?: number; // int64
  casLogin?: string;
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

