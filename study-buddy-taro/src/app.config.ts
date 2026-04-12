import { ADAPTED_PAGES, RouteNames } from "~/constants/routes";

export default defineAppConfig({
  pages: [
    ADAPTED_PAGES[RouteNames.HOME],
    ADAPTED_PAGES[RouteNames.CHECKIN_LIST],
    ADAPTED_PAGES[RouteNames.COMMUNITY],
    ADAPTED_PAGES[RouteNames.MY],
    ADAPTED_PAGES[RouteNames.LOGIN],
    ADAPTED_PAGES[RouteNames.CHECKIN_DETAIL],
    ADAPTED_PAGES[RouteNames.NOTE_DETAIL],
    ADAPTED_PAGES[RouteNames.NOTE_ADD],
    ADAPTED_PAGES[RouteNames.NOTE_LIST],
    ADAPTED_PAGES[RouteNames.SIGN],
    ADAPTED_PAGES[RouteNames.PARTNER],
    ADAPTED_PAGES[RouteNames.USER_PROFILE],
    ADAPTED_PAGES[RouteNames.MY_EDIT],
    ADAPTED_PAGES[RouteNames.MESSAGES],
    ADAPTED_PAGES[RouteNames.FAVORITE],
    ADAPTED_PAGES[RouteNames.USER_AGREEMENT],
    ADAPTED_PAGES[RouteNames.PRIVACY_POLICY],
  ],
  window: {
    backgroundTextStyle: "dark",
    navigationBarBackgroundColor: "#ffffff",
    navigationBarTitleText: "学习伴侣",
    navigationBarTextStyle: "black",
    backgroundColor: "#f5f6fa",
  },
  tabBar: {
    color: "#999999",
    selectedColor: "#58CC02",
    backgroundColor: "#ffffff",
    borderStyle: "white",
    list: [
      {
        pagePath: ADAPTED_PAGES[RouteNames.HOME],
        text: "今天",
        iconPath: "assets/tabbar/home.png",
        selectedIconPath: "assets/tabbar/home_active.png",
      },
      {
        pagePath: ADAPTED_PAGES[RouteNames.CHECKIN_LIST],
        text: "打卡",
        iconPath: "assets/tabbar/checkin.png",
        selectedIconPath: "assets/tabbar/checkin_active.png",
      },
      {
        pagePath: ADAPTED_PAGES[RouteNames.COMMUNITY],
        text: "社区",
        iconPath: "assets/tabbar/community.png",
        selectedIconPath: "assets/tabbar/community_active.png",
      },
      {
        pagePath: ADAPTED_PAGES[RouteNames.MY],
        text: "我的",
        iconPath: "assets/tabbar/my.png",
        selectedIconPath: "assets/tabbar/my_active.png",
      },
    ],
  },
});
