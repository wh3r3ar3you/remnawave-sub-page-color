(function () {
  var explicitIconUrl = "__BRANDING_ICON_URL__";

  function applyIconUrl(iconUrl) {
    if (!iconUrl) {
      return;
    }

    document.querySelectorAll('link[rel*="icon"]').forEach((node) => {
      node.href = iconUrl;
    });

    let shortcutIcon = document.querySelector('link[rel="shortcut icon"]');

    if (!shortcutIcon) {
      shortcutIcon = document.createElement("link");
      shortcutIcon.rel = "shortcut icon";
      document.head.appendChild(shortcutIcon);
    }

    shortcutIcon.href = iconUrl;
  }

  async function applyBranding() {
    try {
      if (explicitIconUrl && explicitIconUrl !== "__BRANDING_ICON_URL__") {
        applyIconUrl(explicitIconUrl);
        return;
      }

      const response = await fetch("/assets/app-config.json?v=" + Date.now(), {
        credentials: "same-origin"
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const logoUrl = payload?.config?.branding?.logoUrl;

      if (!logoUrl) {
        return;
      }

      applyIconUrl(logoUrl);
    } catch (_) {
      // Ignore branding favicon failures and keep default icons.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyBranding, { once: true });
  } else {
    applyBranding();
  }
})();
