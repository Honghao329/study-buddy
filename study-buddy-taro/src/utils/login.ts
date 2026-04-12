import { useLogin } from "taro-hooks";

export function useWechatAuth() {
  const { login } = useLogin();

  const getWechatAuthInfo = () => {
    login(true)
      .then((res) => {
        if (res.errMsg !== "login:ok") {
          console.error(`WeChat login failed: ${res.errMsg}`);
          return;
        }

        // 旧版微信授权流程已废弃，当前仅保留登录能力以兼容历史调用。
        console.debug("WeChat login completed successfully.");
      })
      .catch((error) => {
        console.error("Login promise rejected:", error);
      });
  };

  return { getWechatAuthInfo };
}
