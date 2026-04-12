export enum RouteNames {
  HOME = "HOME",
  CHECKIN_LIST = "CHECKIN_LIST",
  COMMUNITY = "COMMUNITY",
  MY = "MY",
  LOGIN = "LOGIN",
  CHECKIN_DETAIL = "CHECKIN_DETAIL",
  NOTE_DETAIL = "NOTE_DETAIL",
  NOTE_ADD = "NOTE_ADD",
  NOTE_LIST = "NOTE_LIST",
  SIGN = "SIGN",
  PARTNER = "PARTNER",
  USER_PROFILE = "USER_PROFILE",
  MY_EDIT = "MY_EDIT",
  MESSAGES = "MESSAGES",
  FAVORITE = "FAVORITE",
  USER_AGREEMENT = "USER_AGREEMENT",
  PRIVACY_POLICY = "PRIVACY_POLICY",
}

export const PAGES = {
  [RouteNames.HOME]: "/pages/index/index",
  [RouteNames.CHECKIN_LIST]: "/pages/checkin-list/index",
  [RouteNames.COMMUNITY]: "/pages/community/index",
  [RouteNames.MY]: "/pages/my/index",
  [RouteNames.LOGIN]: "/pages/login/index",
  [RouteNames.CHECKIN_DETAIL]: "/pages/checkin-detail/index",
  [RouteNames.NOTE_DETAIL]: "/pages/note-detail/index",
  [RouteNames.NOTE_ADD]: "/pages/note-add/index",
  [RouteNames.NOTE_LIST]: "/pages/note-list/index",
  [RouteNames.SIGN]: "/pages/sign/index",
  [RouteNames.PARTNER]: "/pages/partner/index",
  [RouteNames.USER_PROFILE]: "/pages/user-profile/index",
  [RouteNames.MY_EDIT]: "/pages/my-edit/index",
  [RouteNames.MESSAGES]: "/pages/messages/index",
  [RouteNames.FAVORITE]: "/pages/favorite/index",
  [RouteNames.USER_AGREEMENT]: "/pages/agreements/user-agreement",
  [RouteNames.PRIVACY_POLICY]: "/pages/agreements/privacy-policy",
} as const;

export const TAB_ROUTE_NAMES = [
  RouteNames.HOME,
  RouteNames.CHECKIN_LIST,
  RouteNames.COMMUNITY,
  RouteNames.MY,
] as const;

export function adaptPath(path: string): string {
  return path.replace(/^\//, "");
}

export const ADAPTED_PAGES = Object.entries(PAGES).reduce(
  (acc, [key, path]) => ({
    ...acc,
    [key]: adaptPath(path),
  }),
  {} as { [K in RouteNames]: string },
);

export const ADAPTED_TAB_PAGES = TAB_ROUTE_NAMES.map((route) => ADAPTED_PAGES[route]);

export function isTabPage(path?: string) {
  if (!path) {
    return false;
  }

  return ADAPTED_TAB_PAGES.includes(adaptPath(path));
}
