(function() {
  function season() {
    return document.body && document.body.dataset ? document.body.dataset.season : "default";
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function themeMode() {
    return document.documentElement && document.documentElement.dataset ? document.documentElement
      .dataset.theme : "light";
  }

  function clearEffects() {
    document.querySelectorAll(".holiday-snow-layer,.holiday-halloween-layer,.holiday-fall-layer")
      .forEach(layer => layer.remove());
  }

  function createSnow() {
    clearEffects();
    const layer = document.createElement("div");
    layer.className = "holiday-snow-layer";
    layer.setAttribute("aria-hidden", "true");
    const width = window.innerWidth || 1200;
    const isMobile = width < 760;
    const reduced = prefersReducedMotion();
    const dark = themeMode() === "dark";
    const flakeCount = reduced ? 24 : isMobile ? 54 : 110;
    const lionCount = isMobile ? 2 : 4;
    const treeCount = isMobile ? 3 : 5;
    // Snow
    for (let i = 0; i < flakeCount; i++) {
      const flake = document.createElement("span");
      flake.className = "holiday-snowflake";
      const size = random(isMobile ? 2.2 : 2.6, isMobile ? 6.2 : 8.6);
      const left = random(-4, 104);
      const drift = random(-90, 90);
      const sway = random(10, isMobile ? 34 : 56);
      const duration = random(isMobile ? 9 : 10, isMobile ? 20 : 24);
      const driftDuration = random(3, 7);
      const pulseDuration = random(2, 5);
      const delay = random(-26, 0);
      const opacity = random(36, 96) / 100;
      flake.style.setProperty("--snow-size", size.toFixed(1) + "px");
      flake.style.setProperty("--snow-left", left.toFixed(2) + "vw");
      flake.style.setProperty("--snow-drift", drift.toFixed(1) + "px");
      flake.style.setProperty("--snow-sway", sway.toFixed(1) + "px");
      flake.style.setProperty("--snow-duration", duration.toFixed(1) + "s");
      flake.style.setProperty("--snow-drift-duration", driftDuration.toFixed(1) + "s");
      flake.style.setProperty("--snow-pulse-duration", pulseDuration.toFixed(1) + "s");
      flake.style.setProperty("--snow-delay", delay.toFixed(1) + "s");
      flake.style.setProperty("--snow-opacity", opacity.toFixed(2));
      layer.appendChild(flake);
    }
    // Peachtree lion emblems
    const lionImage = dark ? "url('assets/ptc-emblem-light.png')" :
      "url('assets/ptc-emblem-dark.png')";
    const lionPositions = isMobile ?
      [{
        left: 10,
        top: 18,
        size: 56
      }, {
        left: 72,
        top: 62,
        size: 62
      }] :
      [{
        left: 8,
        top: 16,
        size: 72
      }, {
        left: 72,
        top: 18,
        size: 78
      }, {
        left: 16,
        top: 66,
        size: 74
      }, {
        left: 76,
        top: 72,
        size: 76
      }];
    for (let i = 0; i < lionCount; i++) {
      const pos = lionPositions[i % lionPositions.length];
      const lion = document.createElement("span");
      lion.className = "christmas-lion";
      lion.style.setProperty("--christmas-lion-left", pos.left + "vw");
      lion.style.setProperty("--christmas-lion-top", pos.top + "vh");
      lion.style.setProperty("--christmas-lion-size", pos.size + "px");
      lion.style.setProperty("--christmas-lion-opacity", dark ? "0.15" : "0.11");
      lion.style.setProperty("--christmas-lion-duration", (7.6 + i * 1.15).toFixed(1) + "s");
      lion.style.setProperty("--christmas-lion-delay", (-i * 1.4).toFixed(1) + "s");
      lion.style.setProperty("--christmas-lion-image", lionImage);
      lion.style.setProperty("--christmas-lion-filter", dark ?
        "sepia(.28) saturate(1.12) brightness(1.22) drop-shadow(0 0 18px rgba(176,138,72,.16))" :
        "sepia(.18) saturate(1.02) brightness(.86) drop-shadow(0 0 12px rgba(176,138,72,.10))");
      layer.appendChild(lion);
    }
    // Christmas trees
    const treePositions = isMobile ?
      [{
        left: 4,
        top: 74,
        size: 34
      }, {
        left: 42,
        top: 82,
        size: 36
      }, {
        left: 82,
        top: 76,
        size: 34
      }] :
      [{
        left: 4,
        top: 74,
        size: 42
      }, {
        left: 22,
        top: 84,
        size: 44
      }, {
        left: 44,
        top: 76,
        size: 40
      }, {
        left: 66,
        top: 84,
        size: 46
      }, {
        left: 88,
        top: 76,
        size: 42
      }];
    for (let i = 0; i < treeCount; i++) {
      const pos = treePositions[i % treePositions.length];
      const tree = document.createElement("span");
      tree.className = "christmas-tree";
      tree.style.setProperty("--christmas-tree-left", pos.left + "vw");
      tree.style.setProperty("--christmas-tree-top", pos.top + "vh");
      tree.style.setProperty("--christmas-tree-size", pos.size + "px");
      tree.style.setProperty("--christmas-tree-opacity", dark ? "0.40" : "0.32");
      tree.style.setProperty("--christmas-tree-duration", (5.8 + i * 0.7).toFixed(1) + "s");
      tree.style.setProperty("--christmas-tree-delay", (-i * 0.9).toFixed(1) + "s");
      layer.appendChild(tree);
    }
    document.body.appendChild(layer);
  }

  function createHalloween() {
    clearEffects();
    const layer = document.createElement("div");
    layer.className = "holiday-halloween-layer";
    layer.setAttribute("aria-hidden", "true");
    const width = window.innerWidth || 1200;
    const isMobile = width < 760;
    const reduced = prefersReducedMotion();
    const dark = themeMode() === "dark";
    const fogCount = reduced ? 3 : isMobile ? 4 : 6;
    const sparkCount = reduced ? 8 : isMobile ? 18 : 34;
    const lionCount = isMobile ? 3 : 5;
    const pumpkinCount = isMobile ? 4 : 6;
    const logoCount = isMobile ? 3 : 5;
    for (let i = 0; i < fogCount; i++) {
      const fog = document.createElement("span");
      fog.className = "halloween-fog";
      fog.style.setProperty("--fog-top", random(12, 92).toFixed(1) + "vh");
      fog.style.setProperty("--fog-height", random(42, 120).toFixed(1) + "px");
      fog.style.setProperty("--fog-opacity", (random(18, 42) / 100).toFixed(2));
      fog.style.setProperty("--fog-duration", random(8, 18).toFixed(1) + "s");
      fog.style.setProperty("--fog-delay", random(-10, 0).toFixed(1) + "s");
      layer.appendChild(fog);
    }
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement("span");
      spark.className = "halloween-spark";
      spark.style.setProperty("--spark-left", random(0, 100).toFixed(2) + "vw");
      spark.style.setProperty("--spark-top", random(8, 96).toFixed(2) + "vh");
      spark.style.setProperty("--spark-size", random(2, isMobile ? 4.0 : 5.0).toFixed(1) + "px");
      spark.style.setProperty("--spark-opacity", (random(18, 62) / 100).toFixed(2));
      spark.style.setProperty("--spark-drift", random(-30, 30).toFixed(1) + "px");
      spark.style.setProperty("--spark-duration", random(3, 8).toFixed(1) + "s");
      spark.style.setProperty("--spark-delay", random(-8, 0).toFixed(1) + "s");
      layer.appendChild(spark);
    }
    const bgLogoImage = dark ? "url('assets/ptc-nav-logo-light.png')" :
      "url('assets/ptc-nav-logo-dark.png')";
    const bgLogoPositions = isMobile ?
      [{
        left: 6,
        top: 18,
        width: 120
      }, {
        left: 52,
        top: 56,
        width: 126
      }, {
        left: 18,
        top: 76,
        width: 118
      }] :
      [{
        left: 4,
        top: 18,
        width: 170
      }, {
        left: 62,
        top: 20,
        width: 188
      }, {
        left: 42,
        top: 60,
        width: 176
      }, {
        left: 12,
        top: 78,
        width: 164
      }, {
        left: 74,
        top: 76,
        width: 170
      }];
    for (let i = 0; i < logoCount; i++) {
      const pos = bgLogoPositions[i % bgLogoPositions.length];
      const logo = document.createElement("span");
      logo.className = "halloween-logo";
      logo.style.setProperty("--bg-logo-left", pos.left + "vw");
      logo.style.setProperty("--bg-logo-top", pos.top + "vh");
      logo.style.setProperty("--bg-logo-width", pos.width + "px");
      logo.style.setProperty("--bg-logo-opacity", dark ? (random(4, 8) / 100).toFixed(2) : (
        random(5, 9) / 100).toFixed(2));
      logo.style.setProperty("--bg-logo-duration", random(9, 16).toFixed(1) + "s");
      logo.style.setProperty("--bg-logo-delay", random(-6, 0).toFixed(1) + "s");
      logo.style.setProperty("--bg-logo-image", bgLogoImage);
      logo.style.setProperty("--bg-logo-filter", dark ?
        "sepia(.20) brightness(1.20) saturate(1.05)" :
        "sepia(.15) brightness(.88) saturate(1.05)");
      layer.appendChild(logo);
    }
    const lionImage = dark ? "url('assets/ptc-emblem-light.png')" :
      "url('assets/ptc-emblem-dark.png')";
    const featureLionPositions = isMobile ?
      [{
        left: 8,
        top: 60,
        size: 82
      }, {
        left: 58,
        top: 68,
        size: 88
      }, {
        left: 34,
        top: 82,
        size: 84
      }] :
      [{
        left: 8,
        top: 56,
        size: 112
      }, {
        left: 40,
        top: 70,
        size: 106
      }, {
        left: 74,
        top: 58,
        size: 116
      }, {
        left: 24,
        top: 84,
        size: 100
      }, {
        left: 58,
        top: 84,
        size: 98
      }];
    featureLionPositions.forEach((pos, index) => {
      const featureLion = document.createElement("span");
      featureLion.className = "halloween-feature-lion";
      featureLion.style.setProperty("--feature-lion-left", pos.left + "vw");
      featureLion.style.setProperty("--feature-lion-top", pos.top + "vh");
      featureLion.style.setProperty("--feature-lion-size", pos.size + "px");
      featureLion.style.setProperty("--feature-lion-opacity", dark ? "0.34" : "0.26");
      featureLion.style.setProperty("--feature-lion-duration", (6.8 + index * 1.15).toFixed(
        1) + "s");
      featureLion.style.setProperty("--feature-lion-delay", (-index * 1.7).toFixed(1) + "s");
      featureLion.style.setProperty("--feature-lion-image", lionImage);
      featureLion.style.setProperty("--feature-lion-filter", dark ?
        "sepia(.38) saturate(1.28) brightness(1.28) drop-shadow(0 0 22px rgba(225,138,46,.24))" :
        "sepia(.26) saturate(1.16) brightness(.72) contrast(1.08) drop-shadow(0 0 16px rgba(176,138,72,.18))"
        );
      layer.appendChild(featureLion);
    });
    for (let i = 0; i < lionCount; i++) {
      const lion = document.createElement("span");
      lion.className = "halloween-lion";
      lion.style.setProperty("--lion-left", random(4, 86).toFixed(2) + "vw");
      lion.style.setProperty("--lion-top", random(14, 84).toFixed(2) + "vh");
      lion.style.setProperty("--lion-size", random(isMobile ? 40 : 48, isMobile ? 66 : 84)
        .toFixed(1) + "px");
      lion.style.setProperty("--lion-opacity", dark ? (random(20, 30) / 100).toFixed(2) : (random(
        16, 24) / 100).toFixed(2));
      lion.style.setProperty("--lion-duration", random(7, 12).toFixed(1) + "s");
      lion.style.setProperty("--lion-delay", random(-8, 0).toFixed(1) + "s");
      lion.style.setProperty("--lion-image", lionImage);
      lion.style.setProperty("--lion-filter", dark ? "sepia(.35) saturate(1.2) brightness(1.12)" :
        "sepia(.25) saturate(1.1) opacity(.95)");
      layer.appendChild(lion);
    }
    const pumpkinPositions = isMobile ?
      [{
        left: 4,
        top: 82
      }, {
        left: 30,
        top: 86
      }, {
        left: 58,
        top: 84
      }, {
        left: 82,
        top: 86
      }] :
      [{
        left: 4,
        top: 80
      }, {
        left: 20,
        top: 86
      }, {
        left: 40,
        top: 82
      }, {
        left: 58,
        top: 86
      }, {
        left: 76,
        top: 81
      }, {
        left: 90,
        top: 85
      }];
    for (let i = 0; i < pumpkinCount; i++) {
      const pos = pumpkinPositions[i % pumpkinPositions.length];
      const pumpkin = document.createElement("span");
      pumpkin.className = "halloween-pumpkin";
      pumpkin.style.setProperty("--pumpkin-left", pos.left + "vw");
      pumpkin.style.setProperty("--pumpkin-top", pos.top + "vh");
      pumpkin.style.setProperty("--pumpkin-size", random(isMobile ? 30 : 34, isMobile ? 46 : 56)
        .toFixed(1) + "px");
      pumpkin.style.setProperty("--pumpkin-opacity", dark ? (random(26, 40) / 100).toFixed(2) : (
        random(18, 28) / 100).toFixed(2));
      pumpkin.style.setProperty("--pumpkin-duration", random(4.5, 7.5).toFixed(1) + "s");
      pumpkin.style.setProperty("--pumpkin-delay", random(-4, 0).toFixed(1) + "s");
      layer.appendChild(pumpkin);
    }
    document.body.appendChild(layer);
  }

  function createFall() {
    clearEffects();
    const layer = document.createElement("div");
    layer.className = "holiday-fall-layer";
    layer.setAttribute("aria-hidden", "true");
    const width = window.innerWidth || 1200;
    const isMobile = width < 760;
    const reduced = prefersReducedMotion();
    const dark = themeMode() === "dark";
    const leafCount = reduced ? 18 : isMobile ? 34 : 72;
    const emberCount = reduced ? 10 : isMobile ? 16 : 34;
    const lionCount = isMobile ? 2 : 4;
    for (let i = 0; i < leafCount; i++) {
      const leaf = document.createElement("span");
      leaf.className = "fall-leaf";
      leaf.style.setProperty("--fall-left", random(-8, 108).toFixed(2) + "vw");
      leaf.style.setProperty("--fall-size", random(isMobile ? 8 : 9, isMobile ? 17 : 24).toFixed(
        1) + "px");
      leaf.style.setProperty("--fall-drift", random(-120, 120).toFixed(1) + "px");
      leaf.style.setProperty("--fall-duration", random(isMobile ? 10 : 12, isMobile ? 22 : 28)
        .toFixed(1) + "s");
      leaf.style.setProperty("--fall-spin-duration", random(3.8, 7.6).toFixed(1) + "s");
      leaf.style.setProperty("--fall-delay", random(-26, 0).toFixed(1) + "s");
      leaf.style.setProperty("--fall-opacity", (random(dark ? 32 : 26, dark ? 72 : 58) / 100)
        .toFixed(2));
      leaf.style.setProperty("--fall-hue", random(24, 46).toFixed(1) + "deg");
      layer.appendChild(leaf);
    }
    for (let i = 0; i < emberCount; i++) {
      const ember = document.createElement("span");
      ember.className = "fall-ember";
      ember.style.setProperty("--ember-left", random(0, 100).toFixed(2) + "vw");
      ember.style.setProperty("--ember-top", random(5, 95).toFixed(2) + "vh");
      ember.style.setProperty("--ember-size", random(2.2, 5.8).toFixed(1) + "px");
      ember.style.setProperty("--ember-duration", random(5, 11).toFixed(1) + "s");
      ember.style.setProperty("--ember-delay", random(-9, 0).toFixed(1) + "s");
      ember.style.setProperty("--ember-opacity", (random(20, dark ? 55 : 42) / 100).toFixed(2));
      layer.appendChild(ember);
    }
    const lionImage = dark ? "url('assets/ptc-emblem-light.png')" :
      "url('assets/ptc-emblem-dark.png')";
    const lionPositions = isMobile ?
      [{
        left: 8,
        top: 20,
        size: 58
      }, {
        left: 76,
        top: 68,
        size: 62
      }] :
      [{
        left: 7,
        top: 18,
        size: 80
      }, {
        left: 78,
        top: 18,
        size: 86
      }, {
        left: 14,
        top: 72,
        size: 78
      }, {
        left: 78,
        top: 72,
        size: 84
      }];
    for (let i = 0; i < lionCount; i++) {
      const pos = lionPositions[i % lionPositions.length];
      const lion = document.createElement("span");
      lion.className = "fall-lion";
      lion.style.setProperty("--fall-lion-left", pos.left + "vw");
      lion.style.setProperty("--fall-lion-top", pos.top + "vh");
      lion.style.setProperty("--fall-lion-size", pos.size + "px");
      lion.style.setProperty("--fall-lion-opacity", dark ? "0.14" : "0.09");
      lion.style.setProperty("--fall-lion-image", lionImage);
      lion.style.setProperty("--fall-lion-duration", (9 + i * 1.2).toFixed(1) + "s");
      lion.style.setProperty("--fall-lion-delay", (-i * 1.5).toFixed(1) + "s");
      layer.appendChild(lion);
    }
    document.body.appendChild(layer);
  }

  function syncHolidayEffects() {
    const current = season();
    if (current === "christmas")
      createSnow();
    else if (current === "halloween")
      createHalloween();
    else if (current === "fall")
      createFall();
    else
      clearEffects();
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncHolidayEffects);
  } else {
    syncHolidayEffects();
  }
  window.addEventListener("resize", function() {
    clearTimeout(window.__portalHolidayResizeTimer);
    window.__portalHolidayResizeTimer = setTimeout(syncHolidayEffects, 180);
  });
  const htmlObserver = new MutationObserver(function() {
    syncHolidayEffects();
  });
  if (document.documentElement) {
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }
  window.PortalHoliday = {
    setSeason: function(newSeason) {
      document.body.dataset.season = newSeason || "default";
      syncHolidayEffects();
    }
  };
})();
