/**
 * 壳页 head 尽早执行：恢复侧栏收起 / 主色导航偏好，避免切页首帧闪一下。
 * 须在 shell.css 之后、body 内容前或尽早加载。
 */
(function () {
  "use strict";
  try {
    if (window.localStorage.getItem("wa-app-rail-collapsed") === "1") {
      document.documentElement.classList.add("wa-pref-rail-collapsed");
    }
    if (window.localStorage.getItem("wa-app-rail-primary") === "1") {
      document.documentElement.classList.add("wa-pref-rail-primary");
    }
  } catch (err) {}
})();
