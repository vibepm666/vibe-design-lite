/* Lite landing: hero accent stroke */
/* —— Hero 手绘下划线：加载绘制 + 轻微随机 —— */
  (function heroAccentStroke() {
    var stroke = document.querySelector(".wa-hero__accent-stroke");
    if (!stroke) return;

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 贴齐文字；右侧略留空，旋转也不易顶出 */
    var left = rand(0, 1);
    var right = rand(0.5, 1.5);
    stroke.style.setProperty("--wa-accent-left", left.toFixed(2) + "%");
    stroke.style.setProperty("--wa-accent-right", right.toFixed(2) + "%");
    stroke.style.setProperty("--wa-accent-rot", rand(-1.8, 0.3).toFixed(2) + "deg");
    stroke.style.setProperty("--wa-accent-opacity", rand(0.82, 0.96).toFixed(2));
    stroke.style.setProperty("--wa-accent-dur", (reduce ? 0 : rand(0.72, 1.35)).toFixed(2) + "s");
    stroke.style.setProperty("--wa-accent-delay", (reduce ? 0 : rand(0.12, 0.48)).toFixed(2) + "s");

    requestAnimationFrame(function () {
      stroke.classList.add("is-ready");
    });
  })();
