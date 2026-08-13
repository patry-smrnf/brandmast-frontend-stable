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
  /** Opcjonalny tytuł - jeśli backend go obsługuje przy akceptacji. */
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

/** POST /api/action/bm/isConflict */
export interface ActionConflictResponse {
  isConflicted?: boolean;
  since?: string; // date-time
  until?: string; // date-time
}

export interface ApiResponseActionConflictResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: ActionConflictResponse;
  violations?: Violation[];
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
  /** Poprawna nazwa pola - część backendów zwraca zamiast `isDeteletingAllowed`. */
  isDeletingAllowed?: boolean;
  canSeeConflictActions?: boolean;
}

/** POST /api/action/bm/delete - ten sam kształt co `ActionIdRequest` */
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
  /** `false` = brandmaster must accept data-processing consents before using the app. */
  zgody?: boolean;
}

/** POST /api/brandmaster/sv/delete */
export interface BrandmasterDeleteRequest {
  brandmasterId?: number; // int64
}

/** POST /api/brandmaster/sv/add */
export interface BrandmasterAddRequest {
  name?: string;
  surname?: string;
  tpUuid?: string;
  email?: string;
  login?: string;
}

export interface TourplannerData {
  uuid?: string;
  email?: string;
}

/** GET /api/brandmaster/sv/fetch - element listy */
export interface BrandmastersResponse {
  brandmasterId?: number; // int64
  login?: string;
  name?: string;
  surname?: string;
  kasoterminal?: number; // int64
  tourplannerData?: TourplannerData;
  has121?: boolean;
}

/** GET /api/brandmaster/sv/fetch */
export interface ApiResponseListBrandmastersResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: BrandmastersResponse[];
  violations?: Violation[];
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
  canSeeConflictActions?: boolean;
  casLogin?: string | null;
  casPassword?: string | null;
  requirePassword?: boolean;
  password?: string;
  oneTwoOnePassword?: string;
  kasoterminalNr?: number; // int64
  /** Persist brandmaster data-processing consents (`brandmasterData.zgody`). */
  zgody?: boolean;
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

export interface CasDetails {
  ident?: string;
  name?: string;
  status?: string;
  externalUuid?: string;
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
  cas?: CasDetails[];
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

/** POST /api/cas/action/sv/update-status */
export interface CasActionChangeStatusRequest {
  uuid?: string;
  ident?: string;
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

/** POST /api/cas/action/create-blank */
export interface CreateCasActionRequest {
  idShop: number; // int64
  name: string; // minLength: 1
  since: string; // date-time
  until: string; // date-time
}

export interface TourPlannerActionCreateResult {
  uuid?: string;
  ident?: string;
  name?: string;
  excerpt?: string;
  description?: string;
}

export interface ApiResponseTourPlannerActionCreateResult {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: TourPlannerActionCreateResult;
  violations?: Violation[];
}

/** GET /api/cas/brandmaster/sv/fetch */
export interface TourPlannerBrandmasterListCreated {
  date?: string;
}

export interface TourPlannerBrandmasterListItem {
  uuid?: string;
  ident?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  emailAddress?: string;
  created?: TourPlannerBrandmasterListCreated;
}

export interface ApiResponseListTourPlannerBrandmasterListItem {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: TourPlannerBrandmasterListItem[];
  violations?: Violation[];
}

/** GET /api/121/zgloszeniaSampling/fetch */
export interface OneTwoOneSampling {
  id?: number; // int64
  nr_akcji_pelen?: string;
  data_wpisu?: string;
  data_modyfikacji?: string;
  region_id?: number; // int32
  data_paczki?: string;
  login?: string;
  oferta_samp_prod_1?: number; // int32
}

export interface ApiResponseListOneTwoOneSampling {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneSampling[];
  violations?: Violation[];
}

/** GET /api/121/zgloszeniaAplikacje/fetch */
export interface OneTwoOneAplikacjaZgloszenie {
  id?: number; // int64
  nr_akcji_pelen?: string;
  mail_konsumenta?: string;
  data_wpisu?: string;
  data_modyfikacji?: string;
  oferta_rivo_virto_prod_1?: number; // int32
  login?: string;
}

export interface ApiResponseListOneTwoOneAplikacjaZgloszenie {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneAplikacjaZgloszenie[];
  violations?: Violation[];
}

/** GET /api/121/teams/fetch */
export interface OneTwoOneTeam {
  id?: number; // int32
  nazwa?: string;
  inst_id?: number; // int32
  czy_aktywny?: number; // int32
  lp?: number; // int32
}

export interface ApiResponseListOneTwoOneTeam {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneTeam[];
  violations?: Violation[];
}

/** GET /api/121/products/rivoVirto/fetch */
export interface OneTwoOneRivoVirto {
  id?: number; // int32
  nazwa?: string;
  lp?: number; // int32
}

export interface ApiResponseListOneTwoOneRivoVirto {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneRivoVirto[];
  violations?: Violation[];
}

/** GET /api/121/zgloszeniaAwaryjne/fetch */
export interface OneTwoOneAwaryjneZgloszenia {
  numerAkcji?: string;
  dataWpisu?: string;
  oferta?: string;
}

export interface ApiResponseListOneTwoOneAwaryjneZgloszenia {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneAwaryjneZgloszenia[];
  violations?: Violation[];
}

/** GET /api/121/magazyn/fetch */
export interface OneTwoOneMagazynItem {
  idProduktu?: number; // int32
  nazwa?: string;
  ilosc?: number; // int32
  active?: number; // int32
}

export interface ApiResponseListOneTwoOneMagazynItem {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneMagazynItem[];
  violations?: Violation[];
}

/** GET /api/121/mojstan/fetch */
export interface OneTwoOneMojstanItem {
  title?: string;
}

export interface ApiResponseListOneTwoOneMojstanItem {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneMojstanItem[];
  violations?: Violation[];
}

/** POST /api/121/zgloszeniaSampling/add */
export interface ZgloszeniaSamplingAddRequest {
  data_paczki?: string;
  region_id?: number; // int32
  nr_akcji?: string;
  nr_akcji_koncowka?: string;
  oferta_samp_prod_1?: number; // int32
}

export interface OneTwoOneSamplingCreated {
  id?: number; // int64
  data_paczki?: string;
  data_wpisu?: string;
  data_modyfikacji?: string;
  uzytkownik_wpisu_id?: number; // int32
  uzytkownik_modyfikacji_id?: number; // int32
  region_id?: number; // int32
  rodzaj?: string;
  nr_akcji?: string;
  nr_akcji_koncowka?: string;
  nr_akcji_pelen?: string;
  oferta_samp_prod_1?: string;
  czy_bm?: string;
  czy_velo?: string;
  czy_sampling?: string;
}

export interface ApiResponseOneTwoOneSamplingCreated {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneSamplingCreated;
  violations?: Violation[];
}

/** POST /api/121/zgloszeniaAplikacje/add */
export interface ZgloszeniaAplikacjeAddRequest {
  nr_akcji?: string;
  nr_akcji_koncowka?: string;
  mail_konsumenta?: string;
  oferta_rivo_virto_prod_1?: number; // int32
}

export interface OneTwoOneAplikacjaZgloszenieCreated {
  id?: number; // int64
  data_wpisu?: string;
  data_modyfikacji?: string;
  uzytkownik_wpisu_id?: number; // int32
  uzytkownik_modyfikacji_id?: number; // int32
  nr_akcji?: string;
  nr_akcji_koncowka?: string;
  nr_akcji_pelen?: string;
  mail_konsumenta?: string;
  oferta_rivo_virto_prod_1?: string;
  czy_rivo_virto?: string;
  czy_bm?: string;
  czy_velo?: string;
  czy_sampling?: string;
}

export interface ApiResponseOneTwoOneAplikacjaZgloszenieCreated {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneAplikacjaZgloszenieCreated;
  violations?: Violation[];
}

/** POST /api/121/photo/add */
export interface OneTwoOnePhotoUploaded {
  url?: string;
}

export interface ApiResponseOneTwoOnePhotoUploaded {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOnePhotoUploaded;
  violations?: Violation[];
}

/** POST /api/121/zgloszenieKodMyglo/add */
export interface ZgloszenieKodMygloAddRequest {
  idRegion: number; // int64
  blednyKod: string;
  zdjecie: string;
}

export interface OneTwoOneZgloszenieKodMygloCreated {
  kod_zapasowy?: string;
}

export interface ApiResponseOneTwoOneZgloszenieKodMygloCreated {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: OneTwoOneZgloszenieKodMygloCreated;
  violations?: Violation[];
}

/** POST /api/bonus/bm/create, POST /api/bonus/bm/update, POST /api/bonus/bm/delete */
export interface BonusRequest {
  idBonus?: number; // int64
  title: string;
  amount: number;
}

/** GET /api/bonus/bm/fetch - element listy */
export interface BonusResponse {
  idBonus?: number; // int64
  title?: string;
  amount?: number;
  createdAt?: string; // date-time
}

/** GET /api/bonus/bm/fetch */
export interface ApiResponseListBonusResponse {
  errorCode?: string;
  message?: string;
  meta?: Meta;
  success?: boolean;
  data?: BonusResponse[];
  violations?: Violation[];
}

