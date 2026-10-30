(() => {
  if (window.__universal_sub_mask_initialized) return;
  window.__universal_sub_mask_initialized = true;

  const MASK_ID = "universal-sub-mask";
  const PILL_ID = "universal-mask-floating-pill";
  const HUD_ID = "universal-mask-mini-hud";

  // 1. 双语字典 (i18n)
  const I18N = {
    zh: {
      langBtn: "EN",
      maskOn: "⊘ 遮罩 (开)",
      maskOff: "💤 遮罩 (关)",
      customTheme: "🎨 自定义",
      themes: ["星空紫", "柔和彩虹", "纯黑哑光", "磨砂深灰"],
      width: "宽",
      height: "高",
      opacity: "透",
      center: "居中",
      themeTip: "点击或按 'C' 切换预设",
      colorTip: "点击选择自定义背景色",
      collapseTip: "收起/展开胶囊 (Alt+H 或 Ctrl+Shift+H)"
    },
    en: {
      langBtn: "中",
      maskOn: "⊘ Mask (On)",
      maskOff: "💤 Mask (Off)",
      customTheme: "🎨 Custom",
      themes: ["Galaxy Purple", "Pastel Rainbow", "Matte Black", "Frosted Slate"],
      width: "W",
      height: "H",
      opacity: "Op",
      center: "Center",
      themeTip: "Click or press 'C' to switch theme",
      colorTip: "Click to pick custom color",
      collapseTip: "Collapse/Expand pill (Alt+H or Ctrl+Shift+H)"
    }
  };

  let currentLang = localStorage.getItem("__sub_mask_lang") || "zh";

  // 2. 配色预设配置
  const THEMES = [
    {
      bg: "linear-gradient(135deg, rgba(27, 10, 42, 0.95) 0%, rgba(55, 20, 90, 0.92) 50%, rgba(20, 10, 35, 0.96) 100%)",
      border: "1px solid rgba(186, 104, 200, 0.35)",
      blur: "10px"
    },
    {
      bg: "linear-gradient(125deg, rgba(244, 143, 177, 0.88) 0%, rgba(179, 157, 219, 0.88) 33%, rgba(129, 212, 250, 0.88) 66%, rgba(165, 214, 167, 0.88) 100%)",
      border: "1px solid rgba(255, 255, 255, 0.4)",
      blur: "8px"
    },
    {
      bg: "#000000",
      border: "none",
      blur: "0px"
    },
    {
      bg: "linear-gradient(135deg, rgba(20, 24, 33, 0.94) 0%, rgba(12, 14, 20, 0.96) 100%)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      blur: "10px"
    }
  ];

  let currentThemeIndex = 0;
  let customColor = "#1a1a2e";
  let currentOpacity = 0.95;
  let isCustomMode = false;
  let isMounted = false;

  let maskWidth = 560;
  let maskHeight = 44;

  // 3. 创建遮罩主体
  const mask = document.createElement("div");
  mask.id = MASK_ID;
  Object.assign(mask.style, {
    position: "fixed",
    zIndex: "2147483647",
    cursor: "grab",
    userSelect: "none",
    boxSizing: "border-box",
    borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, border 0.2s"
  });

  const resetCenter = () => {
    const parent = mask.parentElement || document.body;
    const parentWidth = parent === document.body ? window.innerWidth : parent.clientWidth;
    const parentHeight = parent === document.body ? window.innerHeight : parent.clientHeight;

    mask.style.width = `${maskWidth}px`;
    mask.style.height = `${maskHeight}px`;
    mask.style.left = `${Math.max(10, (parentWidth - maskWidth) / 2)}px`;
    mask.style.top = `${Math.max(10, parentHeight * 0.84 - maskHeight)}px`;
  };

  const centerGrip = document.createElement("div");
  centerGrip.style.cssText =
    "width:28px;height:3px;background:rgba(255,255,255,0.25);border-radius:2px;pointer-events:none;";
  mask.appendChild(centerGrip);

  // 三向缩放手柄
  const resizeHandleR = document.createElement("div");
  resizeHandleR.style.cssText =
    "position:absolute;right:0;top:0;width:8px;height:100%;cursor:ew-resize;z-index:10;";

  const resizeHandleB = document.createElement("div");
  resizeHandleB.style.cssText =
    "position:absolute;left:0;bottom:0;width:100%;height:8px;cursor:ns-resize;z-index:10;";

  const resizeHandleSE = document.createElement("div");
  resizeHandleSE.style.cssText =
    "position:absolute;right:2px;bottom:2px;width:12px;height:12px;border-right:2px solid rgba(255,255,255,0.4);border-bottom:2px solid rgba(255,255,255,0.4);cursor:nwse-resize;z-index:11;";

  mask.appendChild(resizeHandleR);
  mask.appendChild(resizeHandleB);
  mask.appendChild(resizeHandleSE);

  const updateMaskStyle = () => {
    mask.style.opacity = currentOpacity;
    if (isCustomMode) {
      mask.style.background = customColor;
      mask.style.border = "1px solid rgba(255, 255, 255, 0.25)";
      mask.style.backdropFilter = "blur(8px)";
      mask.style.webkitBackdropFilter = "blur(8px)";
    } else {
      const theme = THEMES[currentThemeIndex];
      mask.style.background = theme.bg;
      mask.style.border = theme.border;
      mask.style.backdropFilter = `blur(${theme.blur})`;
      mask.style.webkitBackdropFilter = `blur(${theme.blur})`;
    }
  };
  updateMaskStyle();

  // 4. Mini HUD 悬浮调节条
  const hud = document.createElement("div");
  hud.id = HUD_ID;
  Object.assign(hud.style, {
    position: "absolute",
    top: "-46px",
    left: "50%",
    transform: "translateX(-50%)",
    height: "34px",
    padding: "0 12px",
    background: "rgba(18, 20, 26, 0.92)",
    backdropFilter: "blur(12px)",
    borderRadius: "17px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    display: "none",
    alignItems: "center",
    gap: "8px",
    zIndex: "2147483647",
    cursor: "default"
  });

  hud.innerHTML = `
    <span id="hud-lbl-w" style="font-size:11px;color:rgba(255,255,255,0.7);"></span>
    <input type="range" id="hud-w" min="150" max="1400" value="560" style="width:60px;height:4px;cursor:pointer;accent-color:#00aeec;">
    <span id="hud-lbl-h" style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:4px;"></span>
    <input type="range" id="hud-h" min="20" max="240" value="44" style="width:50px;height:4px;cursor:pointer;accent-color:#00aeec;">
    <span id="hud-lbl-op" style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:4px;"></span>
    <input type="range" id="hud-op" min="20" max="100" value="95" style="width:50px;height:4px;cursor:pointer;accent-color:#00aeec;">
    <button id="hud-center-btn" style="padding:2px 8px;font-size:11px;border-radius:4px;background:rgba(255,255,255,0.15);border:none;color:#fff;cursor:pointer;"></button>
  `;
  mask.appendChild(hud);

  hud.addEventListener("mousedown", (e) => e.stopPropagation());

  const wSlider = hud.querySelector("#hud-w");
  const hSlider = hud.querySelector("#hud-h");
  const opSlider = hud.querySelector("#hud-op");
  const centerBtn = hud.querySelector("#hud-center-btn");
  const lblW = hud.querySelector("#hud-lbl-w");
  const lblH = hud.querySelector("#hud-lbl-h");
  const lblOp = hud.querySelector("#hud-lbl-op");

  wSlider.addEventListener("input", (e) => {
    const targetW = parseInt(e.target.value, 10);
    const oldW = mask.offsetWidth;
    const deltaW = targetW - oldW;
    maskWidth = targetW;
    mask.style.left = `${mask.offsetLeft - deltaW / 2}px`;
    mask.style.width = `${maskWidth}px`;
  });

  hSlider.addEventListener("input", (e) => {
    maskHeight = parseInt(e.target.value, 10);
    mask.style.height = `${maskHeight}px`;
  });

  opSlider.addEventListener("input", (e) => {
    currentOpacity = e.target.value / 100;
    updateMaskStyle();
  });

  centerBtn.addEventListener("click", () => resetCenter());

  mask.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    hud.style.display = hud.style.display === "none" ? "flex" : "none";
    if (hud.style.display === "flex") {
      wSlider.value = mask.offsetWidth;
      hSlider.value = mask.offsetHeight;
    }
  });

  // 5. 控制胶囊（Pill）与抽屉收放交互
  const pill = document.createElement("div");
  pill.id = PILL_ID;
  Object.assign(pill.style, {
    position: "fixed",
    top: "70px",
    right: "0px", // 贴近屏幕右边界放置
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px 4px 10px",
    background: "rgba(18, 22, 28, 0.88)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px 0 0 20px", // 左侧圆角，贴合屏幕右边缘
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRight: "none",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
    userSelect: "none",
    transform: "translateX(0)",
    transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease"
  });

  const toggleBtn = document.createElement("span");
  toggleBtn.style.cssText =
    "padding:4px 8px;font-size:12px;font-weight:600;color:#fff;cursor:pointer;border-radius:12px;background:#00aeec;";

  const themeBtn = document.createElement("span");
  themeBtn.style.cssText =
    "padding:4px 8px;font-size:12px;color:#e5e5e5;cursor:pointer;border-radius:12px;background:rgba(255,255,255,0.1);";

  const pickerLabel = document.createElement("label");
  pickerLabel.style.cssText =
    "position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;cursor:pointer;background:conic-gradient(red, yellow, lime, aqua, blue, magenta, red);border:1px solid rgba(255,255,255,0.4);";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = customColor;
  colorInput.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;";
  pickerLabel.appendChild(colorInput);

  colorInput.addEventListener("input", (e) => {
    isCustomMode = true;
    customColor = e.target.value;
    updateMaskStyle();
    updateTextUI();
  });

  const langBtn = document.createElement("span");
  langBtn.style.cssText =
    "padding:2px 6px;font-size:11px;font-weight:bold;color:#aaa;cursor:pointer;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);transition:color 0.2s;";
  langBtn.addEventListener("mouseenter", () => (langBtn.style.color = "#fff"));
  langBtn.addEventListener("mouseleave", () => (langBtn.style.color = "#aaa"));

  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentLang = currentLang === "zh" ? "en" : "zh";
    localStorage.setItem("__sub_mask_lang", currentLang);
    updateTextUI();
  });

  // 收起折叠按钮：展开时显示 ❯（点它向右收起）；收起时显示 ❮（点它向左展开）
  let isPillCollapsed = false;
  const collapseBtn = document.createElement("span");
  collapseBtn.style.cssText =
    "padding:2px 6px;font-size:12px;font-weight:bold;color:#00aeec;cursor:pointer;border-radius:6px;transition:color 0.2s;line-height:1;";
  collapseBtn.innerText = "❯";

  const renderCollapseState = () => {
    if (isPillCollapsed) {
      // 收拢状态：几乎完全隐入右侧屏幕，只留出边缘和箭头
      pill.style.transform = `translateX(${pill.offsetWidth - 24}px)`;
      pill.style.opacity = "0.4";
      collapseBtn.innerText = "❮"; // 提示向左展开
    } else {
      // 展开状态：完全呈现
      pill.style.transform = "translateX(0)";
      pill.style.opacity = "1";
      collapseBtn.innerText = "❯"; // 提示向右收起
    }
  };

  const togglePillCollapse = () => {
    isPillCollapsed = !isPillCollapsed;
    renderCollapseState();
  };

  collapseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePillCollapse();
  });

  // 鼠标移入收纳态时临时滑出，移开后恢复收起
  pill.addEventListener("mouseenter", () => {
    if (isPillCollapsed) {
      pill.style.transform = "translateX(0)";
      pill.style.opacity = "1";
    }
  });

  pill.addEventListener("mouseleave", () => {
    if (isPillCollapsed) {
      pill.style.transform = `translateX(${pill.offsetWidth - 24}px)`;
      pill.style.opacity = "0.4";
    }
  });

  pill.appendChild(toggleBtn);
  pill.appendChild(themeBtn);
  pill.appendChild(pickerLabel);
  pill.appendChild(langBtn);
  pill.appendChild(collapseBtn);

  const updateTextUI = () => {
    const t = I18N[currentLang];
    const isHidden = mask.style.display === "none";
    toggleBtn.innerText = isHidden ? t.maskOff : t.maskOn;
    themeBtn.innerText = isCustomMode ? t.customTheme : `🎨 ${t.themes[currentThemeIndex]}`;
    themeBtn.title = t.themeTip;
    pickerLabel.title = t.colorTip;
    collapseBtn.title = t.collapseTip;
    langBtn.innerText = t.langBtn;

    lblW.innerText = t.width;
    lblH.innerText = t.height;
    lblOp.innerText = t.opacity;
    centerBtn.innerText = t.center;
  };
  updateTextUI();

  const toggleMask = () => {
    const isHidden = mask.style.display === "none";
    mask.style.display = isHidden ? "flex" : "none";
    toggleBtn.style.opacity = isHidden ? "1" : "0.5";
    updateTextUI();
    if (!isHidden) hud.style.display = "none";
  };

  const cycleTheme = () => {
    if (isCustomMode) {
      isCustomMode = false;
      currentThemeIndex = 0;
    } else {
      currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    }
    updateMaskStyle();
    updateTextUI();
  };

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMask();
  });

  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    cycleTheme();
  });

  // 6. 快捷键尺寸微调（中心对称伸缩）
  const setDimensions = (dw, dh) => {
    const minW = 120, maxW = window.innerWidth * 0.98;
    const minH = 20, maxH = window.innerHeight * 0.8;

    const oldW = mask.offsetWidth;
    const newW = Math.max(minW, Math.min(maxW, oldW + dw));
    const deltaW = newW - oldW;

    maskWidth = newW;
    maskHeight = Math.max(minH, Math.min(maxH, mask.offsetHeight + dh));

    mask.style.left = `${mask.offsetLeft - deltaW / 2}px`;
    mask.style.width = `${maskWidth}px`;
    mask.style.height = `${maskHeight}px`;

    if (hud.style.display === "flex") {
      wSlider.value = maskWidth;
      hSlider.value = maskHeight;
    }
  };

  // 7. 鼠标拖拽与多向拉伸
  let actionType = null;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, startW = 0, startH = 0;

  const onMouseDown = (e, type) => {
    actionType = type;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = mask.offsetLeft;
    startTop = mask.offsetTop;
    startW = mask.offsetWidth;
    startH = mask.offsetHeight;
    mask.style.cursor =
      type === "drag" ? "grabbing" : type === "resize-r" ? "ew-resize" : type === "resize-b" ? "ns-resize" : "nwse-resize";
    e.preventDefault();
    e.stopPropagation();
  };

  mask.addEventListener("mousedown", (e) => {
    if (e.target.closest(`#${HUD_ID}`)) return;
    onMouseDown(e, "drag");
  });

  resizeHandleR.addEventListener("mousedown", (e) => onMouseDown(e, "resize-r"));
  resizeHandleB.addEventListener("mousedown", (e) => onMouseDown(e, "resize-b"));
  resizeHandleSE.addEventListener("mousedown", (e) => onMouseDown(e, "resize-se"));

  window.addEventListener("mousemove", (e) => {
    if (!actionType) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (actionType === "drag") {
      mask.style.left = `${startLeft + dx}px`;
      mask.style.top = `${startTop + dy}px`;
    } else if (actionType === "resize-r") {
      maskWidth = Math.max(120, startW + dx);
      mask.style.width = `${maskWidth}px`;
    } else if (actionType === "resize-b") {
      maskHeight = Math.max(20, startH + dy);
      mask.style.height = `${maskHeight}px`;
    } else if (actionType === "resize-se") {
      maskWidth = Math.max(120, startW + dx);
      maskHeight = Math.max(20, startH + dy);
      mask.style.width = `${maskWidth}px`;
      mask.style.height = `${maskHeight}px`;
    }
  });

  window.addEventListener("mouseup", () => {
    if (actionType) {
      actionType = null;
      mask.style.cursor = "grab";
    }
  });

  // 8. 键盘监听（修复快捷键被浏览器拦截问题）
  window.addEventListener(
    "keydown",
    (e) => {
      if (!isMounted) return;
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }

      // 收起/展开胶囊快捷键：Alt + H 或 Ctrl/Cmd + Shift + H
      const isAltH = e.altKey && (e.key === "h" || e.key === "H" || e.code === "KeyH");
      const isCtrlShiftH = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "h" || e.key === "H" || e.code === "KeyH");

      if (isAltH || isCtrlShiftH) {
        e.preventDefault();
        e.stopPropagation();
        togglePillCollapse();
      }
      // Alt + [ 缩窄，Alt + ] 加宽
      else if (e.altKey && (e.key === "[" || e.code === "BracketLeft")) {
        e.preventDefault();
        e.stopPropagation();
        setDimensions(-30, 0);
      } else if (e.altKey && (e.key === "]" || e.code === "BracketRight")) {
        e.preventDefault();
        e.stopPropagation();
        setDimensions(30, 0);
      }
      // Alt + - 变矮，Alt + = 增高
      else if (e.altKey && (e.key === "-" || e.code === "Minus")) {
        e.preventDefault();
        e.stopPropagation();
        setDimensions(0, -6);
      } else if (e.altKey && (e.key === "=" || e.code === "Equal")) {
        e.preventDefault();
        e.stopPropagation();
        setDimensions(0, 6);
      }
      // Alt + 0 重新水平居中
      else if (e.altKey && (e.key === "0" || e.code === "Digit0")) {
        e.preventDefault();
        e.stopPropagation();
        resetCenter();
      }
      // C 键轮播换色
      else if (e.key === "c" || e.key === "C" || e.code === "KeyC") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          cycleTheme();
        }
      }
      // Alt + M 或 Ctrl/Cmd + Shift + X 显隐遮罩
      else if (
        (e.altKey && (e.key === "m" || e.key === "M" || e.code === "KeyM")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "x" || e.key === "X" || e.code === "KeyX"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        toggleMask();
      }
    },
    true // capture 阶段捕获，优先级最高
  );

  // 9. 全屏处理与窗口大小变动自动适配
  const handleFullscreenChange = () => {
    if (!isMounted) return;
    const fsTarget =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement;

    if (fsTarget) {
      fsTarget.appendChild(mask);
      fsTarget.appendChild(pill);
      mask.style.position = "absolute";
      pill.style.position = "absolute";
      pill.style.top = "20px";
      pill.style.right = "0px";
    } else {
      document.body.appendChild(mask);
      document.body.appendChild(pill);
      mask.style.position = "fixed";
      pill.style.position = "fixed";
      pill.style.top = "70px";
      pill.style.right = "0px";
    }
  };

  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"].forEach((evt) => {
    document.addEventListener(evt, handleFullscreenChange);
  });

  window.addEventListener("resize", () => {
    if (isMounted && mask.style.display !== "none") {
      const maxLeft = window.innerWidth - mask.offsetWidth;
      if (mask.offsetLeft > maxLeft) {
        mask.style.left = `${Math.max(10, maxLeft)}px`;
      }
    }
  });

  // 10. 挂载及守护侦听
  const mountToBody = () => {
    if (!document.body) {
      window.requestAnimationFrame(mountToBody);
      return;
    }
    if (!document.getElementById(MASK_ID)) {
      document.body.appendChild(mask);
    }
    if (!document.getElementById(PILL_ID)) {
      document.body.appendChild(pill);
    }
    resetCenter();
    isMounted = true;
  };

  const checkAndMount = () => {
    if (document.querySelector("video")) {
      mountToBody();
      return true;
    }
    return false;
  };

  if (!checkAndMount()) {
    const videoObserver = new MutationObserver(() => {
      if (checkAndMount()) videoObserver.disconnect();
    });
    videoObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();