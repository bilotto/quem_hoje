"use strict";

// Applies the feature flags from config.js across every page:
// hides nav links for disabled features and blocks direct access to
// their pages. Nothing is deleted, so flipping a flag back re-enables it.
(function () {
  const features = (window.CONFIG && CONFIG.features) || {};

  // Maps a feature flag to the page it controls.
  const PAGES = {
    roulette: "roleta.html",
  };

  function apply() {
    Object.keys(PAGES).forEach((feature) => {
      if (features[feature] === false) {
        const page = PAGES[feature];
        document
          .querySelectorAll(`a.nav-link[href="${page}"]`)
          .forEach((a) => a.remove());
        if (new RegExp(`${page}$`, "i").test(location.pathname)) {
          location.replace("index.html");
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
