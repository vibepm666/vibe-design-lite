/**
 * 营销概览：日期范围 / 刷新 → 本地 mock 重算 KPI、图表、圆环与表格
 */
(function () {
  "use strict";

  var root = document.querySelector('[data-shell-page="dashboard"]');
  if (!root) return;

  var dash = root.querySelector(".wa-dash");
  var dashExport = document.querySelector("[data-dash-export]");
  var dashRefresh = document.querySelector("[data-dash-refresh]");
  var dashRange = document.querySelector("[data-dash-range]");
  var dashDateStart = document.querySelector("[data-dash-date-start]");
  var dashDateEnd = document.querySelector("[data-dash-date-end]");
  var dashRangeSilent = false;
  var refreshNonce = 0;
  var POINTS = 7;
  var TREND_W = 504;
  var TREND_TOP = 14;
  var TREND_BOT = 214;

  function tip(text, type) {
    var kind = type || "info";
    if (window.WA_MESSAGE && typeof window.WA_MESSAGE[kind] === "function") {
      window.WA_MESSAGE[kind](text);
    }
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatDateInput(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function formatAxis(d) {
    return pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function parseDateInput(value) {
    if (!value) return null;
    var parts = String(value).split("-");
    if (parts.length !== 3) return null;
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    var day = Number(parts[2]);
    if (!y || !m || !day) return null;
    var d = new Date(y, m - 1, day);
    if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return null;
    return d;
  }

  function presetDays(key) {
    if (key === "30d") return 30;
    if (key === "90d") return 90;
    return 7;
  }

  function rangeDays(start, end) {
    return Math.round((end - start) / 86400000) + 1;
  }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function minDate(a, b) {
    return a.getTime() <= b.getTime() ? a : b;
  }

  function syncDateLimits() {
    var today = formatDateInput(startOfToday());
    var start = parseDateInput(dashDateStart && dashDateStart.value);
    var end = parseDateInput(dashDateEnd && dashDateEnd.value);
    if (dashDateStart) {
      dashDateStart.setAttribute("max", end ? formatDateInput(minDate(end, startOfToday())) : today);
    }
    if (dashDateEnd) {
      dashDateEnd.setAttribute("max", today);
      if (start) dashDateEnd.setAttribute("min", formatDateInput(start));
      else dashDateEnd.removeAttribute("min");
    }
  }

  function clampDateInputs() {
    if (!dashDateStart || !dashDateEnd) return false;
    var today = startOfToday();
    var start = parseDateInput(dashDateStart.value);
    var end = parseDateInput(dashDateEnd.value);
    var changed = false;
    if (end && end.getTime() > today.getTime()) {
      end = today;
      dashDateEnd.value = formatDateInput(end);
      changed = true;
    }
    if (start && start.getTime() > today.getTime()) {
      start = today;
      dashDateStart.value = formatDateInput(start);
      changed = true;
    }
    if (start && end && start.getTime() > end.getTime()) {
      start = end;
      dashDateStart.value = formatDateInput(start);
      changed = true;
    }
    syncDateLimits();
    return changed;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fmtInt(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function fmtPct(n, digits) {
    return n.toFixed(digits == null ? 1 : digits) + "%";
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function sampleDates(start, end, count) {
    var out = [];
    var span = end.getTime() - start.getTime();
    for (var i = 0; i < count; i += 1) {
      out.push(new Date(start.getTime() + Math.round((span * i) / (count - 1))));
    }
    return out;
  }

  function yOf(v, max) {
    var t = max <= 0 ? 0 : clamp(v / max, 0, 1);
    return TREND_BOT - t * (TREND_BOT - TREND_TOP);
  }

  function polyline(xs, ys) {
    var parts = [];
    for (var i = 0; i < xs.length; i += 1) {
      parts.push((i ? "L" : "M") + xs[i] + " " + (Math.round(ys[i] * 10) / 10));
    }
    return parts.join(" ");
  }

  function areaPath(xs, ys) {
    return polyline(xs, ys) + " L" + xs[xs.length - 1] + " " + TREND_BOT + " L" + xs[0] + " " + TREND_BOT + " Z";
  }

  function sparkPath(values) {
    var max = Math.max.apply(null, values) || 1;
    var xs = [];
    var ys = [];
    for (var i = 0; i < values.length; i += 1) {
      xs.push(Math.round((72 * i) / (values.length - 1)));
      ys.push(32 - (values[i] / max) * 24);
    }
    return {
      line: polyline(xs, ys),
      area: polyline(xs, ys) + " L72 36 L0 36 Z",
    };
  }

  function buildMock(start, end, nonce) {
    var days = rangeDays(start, end);
    var scale = days / 7;
    var rnd = mulberry32((start.getTime() / 86400000) ^ (end.getTime() / 86400000) ^ (nonce * 9973));
    var jitter = function (base, amp) {
      return base * (1 + (rnd() - 0.5) * amp);
    };

    var uv = Math.round(jitter(12480 * scale, 0.12));
    var leads = Math.round(jitter(186 * scale, 0.14));
    var submits = Math.round(jitter(474 * scale, 0.14));
    var rate = clamp(jitter(3.8, 0.18), 1.6, 6.5);
    var uvDelta = clamp(jitter(8.2, 0.5), -4, 18);
    var leadDelta = clamp(jitter(12.4, 0.45), -3, 22);
    var rateDelta = clamp(jitter(-0.2, 1.2), -1.2, 1.2);
    var submitDelta = clamp(jitter(9.6, 0.45), -4, 20);

    var shares = [0.35, 0.261, 0.176, 0.133, 0.08].map(function (s) {
      return Math.max(0.04, s * (0.85 + rnd() * 0.3));
    });
    var shareSum = shares.reduce(function (a, b) {
      return a + b;
    }, 0);
    shares = shares.map(function (s) {
      return s / shareSum;
    });
    var pageUv = shares.map(function (s) {
      return Math.round(uv * s);
    });
    var pageRates = [3.9, 3.0, 5.2, 3.3, 2.2].map(function (r) {
      return clamp(jitter(r, 0.22), 1.2, 7.5);
    });

    var samples = sampleDates(start, end, POINTS);
    var dailyUv = [];
    var dailyConv = [];
    var dailySubmit = [];
    for (var i = 0; i < POINTS; i += 1) {
      var wave = 0.72 + 0.28 * (i / (POINTS - 1)) + (rnd() - 0.45) * 0.18;
      dailyUv.push(Math.round((uv / POINTS) * wave * 1.35));
      dailyConv.push(Math.round(dailyUv[i] * (rate / 100) * (0.85 + rnd() * 0.3)));
      dailySubmit.push(Math.max(8, Math.round((submits / POINTS) * (0.7 + rnd() * 0.7))));
    }

    var devices = [0.58, 0.32, 0.1].map(function (d) {
      return Math.max(0.05, d * (0.9 + rnd() * 0.2));
    });
    var dSum = devices.reduce(function (a, b) {
      return a + b;
    }, 0);
    devices = devices.map(function (d) {
      return d / dSum;
    });

    var sources = [0.35, 0.24, 0.22, 0.11, 0.08].map(function (s) {
      return Math.max(0.05, s * (0.88 + rnd() * 0.28));
    });
    var sSum = sources.reduce(function (a, b) {
      return a + b;
    }, 0);
    sources = sources.map(function (s) {
      return s / sSum;
    });

    return {
      days: days,
      uv: uv,
      leads: leads,
      submits: submits,
      rate: rate,
      uvDelta: uvDelta,
      leadDelta: leadDelta,
      rateDelta: rateDelta,
      submitDelta: submitDelta,
      pageUv: pageUv,
      pageRates: pageRates,
      shares: shares,
      samples: samples,
      dailyUv: dailyUv,
      dailyConv: dailyConv,
      dailySubmit: dailySubmit,
      devices: devices,
      sources: sources,
      prevUv: Math.round(uv / (1 + uvDelta / 100)),
    };
  }

  function setChip(el, delta, unit) {
    if (!el) return;
    var down = delta < 0;
    el.classList.toggle("is-down", down);
    var abs = Math.abs(delta);
    var text = unit === "pt" ? abs.toFixed(1) + "pt" : abs.toFixed(1) + "%";
    var iconClass = down ? "fa-solid fa-caret-down" : "fa-solid fa-caret-up";
    el.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i> ' + text;
  }

  function applyKpis(mock) {
    var cards = dash.querySelectorAll(".wa-dash__kpi");
    if (cards.length < 4) return;
    var values = [fmtInt(mock.uv), fmtInt(mock.leads), fmtPct(mock.rate), fmtInt(mock.submits)];
    var deltas = [mock.uvDelta, mock.leadDelta, mock.rateDelta, mock.submitDelta];
    var units = ["%", "%", "pt", "%"];
    var foots = [
      "环比上期 " + fmtInt(mock.prevUv) + " · 较上周 " + (mock.uvDelta >= 0 ? "+" : "") + mock.uvDelta.toFixed(1) + "%",
      "提交有效率 " + Math.round(39 + (mock.rate - 3.8) * 2) + "% · 目标 42%",
      "目标 4.0% · 距目标差 " + Math.abs(4 - mock.rate).toFixed(1) + "pt",
      "曝光 " + fmtInt(Math.round(mock.submits / 0.056)) + " · 曝光提交率 5.6%",
    ];
    for (var i = 0; i < 4; i += 1) {
      var card = cards[i];
      var val = card.querySelector(".wa-dash__kpi-value");
      var chip = card.querySelector(".wa-dash__kpi-chip");
      var foot = card.querySelector(".wa-dash__kpi-foot");
      var spark = card.querySelector(".wa-dash__spark");
      if (val) val.textContent = values[i];
      setChip(chip, deltas[i], units[i]);
      if (foot) foot.textContent = foots[i];
      if (spark) {
        var series =
          i === 0
            ? mock.dailyUv
            : i === 1
              ? mock.dailyConv
              : i === 2
                ? mock.dailyUv.map(function (u, idx) {
                    return mock.dailyConv[idx] / Math.max(u, 1);
                  })
                : mock.dailySubmit;
        var paths = sparkPath(series);
        var area = spark.querySelector(".wa-dash__spark-area");
        var line = spark.querySelector(".wa-dash__spark-line");
        if (area) area.setAttribute("d", paths.area);
        if (line) line.setAttribute("d", paths.line);
      }
    }
  }

  function applyAxisLabels(mock) {
    dash.querySelectorAll(".wa-dash__axis-x").forEach(function (axis) {
      var spans = axis.querySelectorAll("span");
      for (var i = 0; i < spans.length && i < mock.samples.length; i += 1) {
        spans[i].textContent = formatAxis(mock.samples[i]);
      }
    });
  }

  function applyTrend(mock) {
    var svg = dash.querySelector(".wa-dash__trend-svg:not(.wa-dash__bars-svg)");
    if (!svg) return;
    var maxUv = Math.max.apply(null, mock.dailyUv) * 1.08;
    var maxConv = Math.max.apply(null, mock.dailyConv) * 1.08;
    var convScale = maxUv * 0.42;
    var xs = [];
    var uvY = [];
    var convY = [];
    for (var i = 0; i < POINTS; i += 1) {
      xs.push(Math.round((TREND_W * i) / (POINTS - 1)));
      uvY.push(yOf(mock.dailyUv[i], maxUv));
      convY.push(yOf((mock.dailyConv[i] / Math.max(maxConv, 1)) * convScale, maxUv));
    }
    var area = svg.querySelector("path.area");
    var line = svg.querySelector("path.line");
    var lineSec = svg.querySelector("path.line-sec");
    if (area) area.setAttribute("d", areaPath(xs, uvY));
    if (line) line.setAttribute("d", polyline(xs, uvY));
    if (lineSec) lineSec.setAttribute("d", polyline(xs, convY));
    var dots = svg.querySelectorAll("circle.dot");
    for (var d = 0; d < dots.length && d < xs.length; d += 1) {
      dots[d].setAttribute("cx", String(xs[d]));
      dots[d].setAttribute("cy", String(Math.round(uvY[d] * 10) / 10));
    }
    var yAxis = svg.closest(".wa-dash__trend-wrap");
    if (yAxis) {
      var labels = yAxis.querySelectorAll(".wa-dash__axis-y span");
      var top = Math.ceil(maxUv / 1000) * 1000;
      var steps = [1, 0.75, 0.5, 0.25, 0];
      for (var yi = 0; yi < labels.length && yi < steps.length; yi += 1) {
        var v = Math.round(top * steps[yi]);
        labels[yi].textContent = v >= 1000 ? Math.round(v / 1000) + "k" : String(v);
      }
    }
  }

  function applyBars(mock) {
    var svg = dash.querySelector(".wa-dash__bars-svg");
    if (!svg) return;
    var max = Math.max.apply(null, mock.dailySubmit) * 1.12;
    var bars = svg.querySelectorAll("rect.bar");
    var vals = svg.querySelectorAll("text.bar-val");
    var peakIdx = 0;
    for (var i = 1; i < mock.dailySubmit.length; i += 1) {
      if (mock.dailySubmit[i] > mock.dailySubmit[peakIdx]) peakIdx = i;
    }
    for (var b = 0; b < bars.length && b < POINTS; b += 1) {
      var h = (mock.dailySubmit[b] / max) * (TREND_BOT - TREND_TOP);
      var y = TREND_BOT - h;
      bars[b].setAttribute("y", String(Math.round(y * 10) / 10));
      bars[b].setAttribute("height", String(Math.round(h * 10) / 10));
      bars[b].classList.toggle("bar-peak", b === peakIdx);
      if (vals[b]) {
        vals[b].textContent = String(mock.dailySubmit[b]);
        vals[b].setAttribute("y", String(Math.round((y - 8) * 10) / 10));
        vals[b].classList.toggle("bar-val-peak", b === peakIdx);
      }
    }
    var wrap = svg.closest(".wa-dash__trend-wrap");
    if (wrap) {
      var labels = wrap.querySelectorAll(".wa-dash__axis-y span");
      var top = Math.ceil(max / 10) * 10;
      var steps = [1, 0.75, 0.5, 0.25, 0];
      for (var yi = 0; yi < labels.length && yi < steps.length; yi += 1) {
        labels[yi].textContent = String(Math.round(top * steps[yi]));
      }
    }
  }

  function applyDonut(mock) {
    var ring = dash.querySelector(".wa-dash__donut-ring");
    var center = dash.querySelector(".wa-dash__donut-center strong");
    var host = dash.querySelector(".wa-dash__donut-host");
    var items = dash.querySelectorAll(".wa-dash__donut-legend-item");
    var stops = [];
    var cursor = 0;
    var mixes = [
      "var(--wa-color-primary)",
      "color-mix(in srgb, var(--wa-color-primary) 78%, #fff)",
      "color-mix(in srgb, var(--wa-color-primary) 58%, #fff)",
      "color-mix(in srgb, var(--wa-color-primary) 38%, #fff)",
      "color-mix(in srgb, var(--wa-color-primary) 22%, #fff)",
    ];
    for (var i = 0; i < mock.shares.length; i += 1) {
      var next = cursor + mock.shares[i] * 100;
      stops.push(mixes[i] + " " + cursor.toFixed(1) + "% " + next.toFixed(1) + "%");
      cursor = next;
      if (items[i]) {
        var value = items[i].querySelector(".wa-dash__donut-legend-value");
        var pct = items[i].querySelector(".wa-dash__donut-legend-pct");
        if (value) value.textContent = fmtInt(mock.pageUv[i]);
        if (pct) pct.textContent = (mock.shares[i] * 100).toFixed(1) + "%";
      }
    }
    if (ring) ring.style.background = "conic-gradient(from 0deg, " + stops.join(", ") + ")";
    if (center) center.textContent = fmtInt(mock.uv);
    if (host) host.setAttribute("aria-label", "落地页 UV 合计 " + mock.uv);
  }

  function applyTable(mock) {
    var rows = dash.querySelectorAll(".wa-dash__table tbody tr");
    for (var i = 0; i < rows.length && i < mock.pageUv.length; i += 1) {
      var num = rows[i].querySelector(".wa-dash__num");
      var rate = rows[i].querySelector(".wa-dash__rate");
      var bar = rows[i].querySelector(".wa-dash__bar-mini i");
      if (num) num.textContent = fmtInt(mock.pageUv[i]);
      if (rate) {
        rate.textContent = fmtPct(mock.pageRates[i]);
        rate.classList.toggle("is-good", mock.pageRates[i] >= 3.8);
      }
      if (bar) {
        var maxRate = Math.max.apply(null, mock.pageRates) || 1;
        bar.style.width = Math.round((mock.pageRates[i] / maxRate) * 100) + "%";
      }
    }
  }

  function applyDevices(mock) {
    var items = dash.querySelectorAll(".wa-dash__devices li");
    for (var i = 0; i < items.length && i < mock.devices.length; i += 1) {
      var pct = Math.round(mock.devices[i] * 100);
      var top = items[i].querySelector(".wa-dash__device-top span");
      var fill = items[i].querySelector(".wa-dash__device-track i");
      if (top) top.textContent = pct + "%";
      if (fill) fill.style.width = pct + "%";
    }
  }

  function applySources(mock) {
    var items = dash.querySelectorAll(".wa-dash__source");
    for (var i = 0; i < items.length && i < mock.sources.length; i += 1) {
      var pct = Math.round(mock.sources[i] * 100);
      var top = items[i].querySelector(".wa-dash__source-top span");
      var fill = items[i].querySelector(".wa-dash__source-fill");
      if (top) top.textContent = pct + "%";
      if (fill) fill.style.width = pct + "%";
    }
  }

  function flashDash() {
    if (!dash) return;
    dash.classList.remove("is-updating");
    void dash.offsetWidth;
    dash.classList.add("is-updating");
    window.setTimeout(function () {
      dash.classList.remove("is-updating");
    }, 420);
  }

  function refreshDash(opts) {
    if (!dash || !dashDateStart || !dashDateEnd) return;
    dashRangeSilent = true;
    clampDateInputs();
    dashRangeSilent = false;
    var start = parseDateInput(dashDateStart.value);
    var end = parseDateInput(dashDateEnd.value);
    if (!start || !end) return;
    if (end < start) {
      var swap = start;
      start = end;
      end = swap;
      dashRangeSilent = true;
      dashDateStart.value = formatDateInput(start);
      dashDateEnd.value = formatDateInput(end);
      syncDateLimits();
      dashRangeSilent = false;
    }
    if (opts && opts.bumpNonce) refreshNonce += 1;
    var mock = buildMock(start, end, refreshNonce);
    applyKpis(mock);
    applyAxisLabels(mock);
    applyTrend(mock);
    applyBars(mock);
    applyDonut(mock);
    applyTable(mock);
    applyDevices(mock);
    applySources(mock);
    flashDash();
    if (opts && opts.tip) tip(opts.tip, "success");
  }

  function getRangeList() {
    if (!dashRange || !dashRange.id) return null;
    return document.getElementById(dashRange.id + "-list");
  }

  /** 「自定义」仅在当前为自定义区间时挂入下拉（对齐 Admin workplace） */
  function ensureCustomOption(show) {
    if (!dashRange) return;
    var existing = dashRange.querySelector('option[value="custom"]');
    var list = getRangeList();
    var listBtn = list && list.querySelector('.wa-combo__option[data-value="custom"]');

    if (show) {
      if (!existing) {
        var opt = document.createElement("option");
        opt.value = "custom";
        opt.textContent = "自定义";
        dashRange.appendChild(opt);
      }
      if (list && !listBtn) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wa-combo__option";
        btn.setAttribute("role", "option");
        btn.setAttribute("data-value", "custom");
        btn.textContent = "自定义";
        btn.addEventListener("click", function () {
          dashRangeSilent = true;
          dashRange.value = "custom";
          dashRange.dispatchEvent(new Event("change", { bubbles: true }));
          dashRangeSilent = false;
          if (window.WA_COMBO && typeof window.WA_COMBO.closeAll === "function") {
            window.WA_COMBO.closeAll();
          }
        });
        li.appendChild(btn);
        list.appendChild(li);
      }
      return;
    }

    if (existing) existing.remove();
    if (listBtn) {
      var row = listBtn.closest("li");
      if (row) row.remove();
      else listBtn.remove();
    }
  }

  function setRangePreset(next) {
    if (!dashRange) return;
    if (next === "custom") ensureCustomOption(true);
    dashRangeSilent = true;
    dashRange.value = next;
    dashRange.dispatchEvent(new Event("change", { bubbles: true }));
    dashRangeSilent = false;
    if (next !== "custom") ensureCustomOption(false);
  }

  function applyDashPreset(key) {
    if (!dashDateStart || !dashDateEnd) return;
    var end = startOfToday();
    var start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    start.setDate(start.getDate() - (presetDays(key) - 1));
    dashRangeSilent = true;
    dashDateStart.value = formatDateInput(start);
    dashDateEnd.value = formatDateInput(end);
    syncDateLimits();
    dashRangeSilent = false;
    setRangePreset(key);
    refreshDash({
      tip: "已切换至" + (key === "30d" ? "近 30 天" : key === "90d" ? "近 90 天" : "近 7 天"),
    });
  }

  function syncDashPresetFromDates() {
    if (!dashRange || !dashDateStart || !dashDateEnd) return;
    dashRangeSilent = true;
    clampDateInputs();
    dashRangeSilent = false;
    var start = parseDateInput(dashDateStart.value);
    var end = parseDateInput(dashDateEnd.value);
    if (!start || !end || end < start) return;
    var span = rangeDays(start, end);
    var today = startOfToday();
    var endIsToday = end.getTime() === today.getTime();
    var next =
      endIsToday && span === 7
        ? "7d"
        : endIsToday && span === 30
          ? "30d"
          : endIsToday && span === 90
            ? "90d"
            : "custom";
    setRangePreset(next);
    refreshDash({ tip: "已按所选日期更新概览" });
  }

  if (dashRefresh) {
    dashRefresh.addEventListener("click", function () {
      if (dashRefresh.disabled) return;
      dashRefresh.disabled = true;
      dashRefresh.classList.add("is-spinning");
      dashRefresh.setAttribute("aria-busy", "true");
      refreshDash({ bumpNonce: true });
      window.setTimeout(function () {
        dashRefresh.disabled = false;
        dashRefresh.classList.remove("is-spinning");
        dashRefresh.removeAttribute("aria-busy");
        tip("数据已刷新", "success");
      }, 600);
    });
  }

  if (dashRange) {
    dashRange.addEventListener("change", function () {
      if (dashRangeSilent) return;
      var key = dashRange.value || "7d";
      if (key === "custom") return;
      applyDashPreset(key);
    });
  }

  if (dashDateStart) {
    dashDateStart.addEventListener("change", function () {
      if (dashRangeSilent) return;
      syncDashPresetFromDates();
    });
  }

  if (dashDateEnd) {
    dashDateEnd.addEventListener("change", function () {
      if (dashRangeSilent) return;
      syncDashPresetFromDates();
    });
  }

  if (dashExport) {
    dashExport.addEventListener("click", function () {
      if (dashExport.disabled) return;
      dashExport.disabled = true;
      dashExport.setAttribute("aria-busy", "true");
      window.setTimeout(function () {
        dashExport.disabled = false;
        dashExport.removeAttribute("aria-busy");
        tip("已导出所选区间概览", "success");
      }, 420);
    });
  }

  /* 初始：日期不可超过今天；默认「近 7 天」以今天为终点 */
  (function initDashRange() {
    var key = (dashRange && dashRange.value) || "7d";
    if (key === "custom") {
      clampDateInputs();
      return;
    }
    var end = startOfToday();
    var start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    start.setDate(start.getDate() - (presetDays(key) - 1));
    dashRangeSilent = true;
    if (dashDateStart) dashDateStart.value = formatDateInput(start);
    if (dashDateEnd) dashDateEnd.value = formatDateInput(end);
    syncDateLimits();
    setRangePreset(key);
    dashRangeSilent = false;
  })();
})();
