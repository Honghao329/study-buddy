import type { RouteNames } from "~/constants/routes";

export interface RouteParams {
  id?: string;
  from?: string;
  userId?: string;
  sort?: string;
}

export interface RouteParamConfig {
  [RouteNames.HOME]: Pick<RouteParams, never>;
  [RouteNames.CHECKIN_LIST]: Pick<RouteParams, never>;
  [RouteNames.COMMUNITY]: Pick<RouteParams, never>;
  [RouteNames.MY]: Pick<RouteParams, never>;
  [RouteNames.LOGIN]: Pick<RouteParams, "from">;
  [RouteNames.CHECKIN_DETAIL]: Pick<RouteParams, "id">;
  [RouteNames.NOTE_DETAIL]: Pick<RouteParams, "id">;
  [RouteNames.NOTE_ADD]: Pick<RouteParams, never>;
  [RouteNames.NOTE_LIST]: Pick<RouteParams, "sort">;
  [RouteNames.SIGN]: Pick<RouteParams, never>;
  [RouteNames.PARTNER]: Pick<RouteParams, never>;
  [RouteNames.USER_PROFILE]: Pick<RouteParams, "id">;
  [RouteNames.MY_EDIT]: Pick<RouteParams, never>;
  [RouteNames.MESSAGES]: Pick<RouteParams, never>;
  [RouteNames.FAVORITE]: Pick<RouteParams, never>;
  [RouteNames.USER_AGREEMENT]: Pick<RouteParams, never>;
  [RouteNames.PRIVACY_POLICY]: Pick<RouteParams, never>;
}

export type RouteParamsFor<T extends RouteNames> = T extends keyof RouteParamConfig
  ? RouteParamConfig[T]
  : Record<string, never>;
