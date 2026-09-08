(function () {
  var explicitIconUrl = "__BRANDING_ICON_URL__";
  var appConfigPath = "/assets/.app-config-v2.json";

  function guessIconType(url) {
    var lower = String(url).toLowerCase().split("?")[0].split("#")[0];

    if (lower.endsWith(".svg")) {
      return "image/svg+xml";
    }

    if (lower.endsWith(".ico")) {
      return "image/x-icon";
    }

    if (lower.endsWith(".webp")) {
      return "image/webp";
    }

    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return "image/jpeg";
    }

    return "image/png";
  }

  function withCacheBuster(url) {
    return String(url).includes("?") ? url : url + "?v=" + Date.now();
  }

  function isPlaceholderLogo(url) {
    return !url || String(url).includes("docs.rw");
  }

  function hasLocalBrandingFavicon() {
    return Boolean(document.querySelector('link[rel*="icon"][href*="branding-favicon-"]'));
  }

  function clearIconLinks() {
    document.querySelectorAll('link[rel*="icon"]').forEach(function (node) {
      node.remove();
    });
  }

  function addIconLink(rel, href, type, sizes) {
    var link = document.createElement("link");
    link.rel = rel;
    link.href = href;

    if (type) {
      link.type = type;
    }

    if (sizes) {
      link.sizes = sizes;
    }

    document.head.prepend(link);
  }

  function applyDirectIconUrl(iconUrl, type) {
    var href = withCacheBuster(iconUrl);

    clearIconLinks();
    addIconLink("icon", href, type, "64x64");
    addIconLink("icon", href, type, "32x32");
    addIconLink("shortcut icon", href, type);
    addIconLink("apple-touch-icon", href, null, "180x180");
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var finished = false;

      function done(err, value) {
        if (finished) {
          return;
        }

        finished = true;

        if (err) {
          reject(err);
          return;
        }

        resolve(value);
      }

      img.onload = function () {
        done(null, img);
      };

      img.onerror = function () {
        done(new Error("Failed to load icon"));
      };

      img.crossOrigin = "anonymous";
      img.src = url;
    });
  }

  function getContentBounds(imageData, width, height) {
    var data = imageData.data;
    var minX = width;
    var minY = height;
    var maxX = 0;
    var maxY = 0;

    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var alpha = data[(y * width + x) * 4 + 3];

        if (alpha > 20) {
          if (x < minX) {
            minX = x;
          }

          if (x > maxX) {
            maxX = x;
          }

          if (y < minY) {
            minY = y;
          }

          if (y > maxY) {
            maxY = y;
          }
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      sx: minX,
      sy: minY,
      sw: maxX - minX + 1,
      sh: maxY - minY + 1
    };
  }

  function analyzeIconBounds(img) {
    var sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = img.naturalWidth;
    sourceCanvas.height = img.naturalHeight;

    var sourceCtx = sourceCanvas.getContext("2d");
    sourceCtx.drawImage(img, 0, 0);

    return getContentBounds(
      sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
      sourceCanvas.width,
      sourceCanvas.height
    );
  }

  function renderNormalizedIconDataUrl(img, size, bounds) {
    var sx = bounds ? bounds.sx : 0;
    var sy = bounds ? bounds.sy : 0;
    var sw = bounds ? bounds.sw : img.naturalWidth;
    var sh = bounds ? bounds.sh : img.naturalHeight;
    var scale = Math.max(size / sw, size / sh);
    var dw = sw * scale;
    var dh = sh * scale;
    var dx = (size - dw) / 2;
    var dy = (size - dh) / 2;

    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    return canvas.toDataURL("image/png");
  }

  async function applyRasterIconUrl(iconUrl) {
    var href = withCacheBuster(iconUrl);
    var img;

    try {
      img = await loadImage(href);
    } catch (_) {
      applyDirectIconUrl(iconUrl, "image/png");
      return;
    }

    try {
      var bounds = analyzeIconBounds(img);
      var icon128 = renderNormalizedIconDataUrl(img, 128, bounds);
      var icon64 = renderNormalizedIconDataUrl(img, 64, bounds);
      var icon48 = renderNormalizedIconDataUrl(img, 48, bounds);
      var icon32 = renderNormalizedIconDataUrl(img, 32, bounds);
      var icon180 = renderNormalizedIconDataUrl(img, 180, bounds);

      clearIconLinks();
      addIconLink("icon", icon128, "image/png", "128x128");
      addIconLink("icon", icon64, "image/png", "64x64");
      addIconLink("icon", icon48, "image/png", "48x48");
      addIconLink("icon", icon32, "image/png", "32x32");
      addIconLink("shortcut icon", icon64, "image/png");
      addIconLink("apple-touch-icon", icon180, "image/png", "180x180");
    } catch (_) {
      applyDirectIconUrl(iconUrl, "image/png");
    }
  }

  async function applyIconUrl(iconUrl) {
    if (isPlaceholderLogo(iconUrl)) {
      return;
    }

    var type = guessIconType(iconUrl);

    if (type === "image/svg+xml" || type === "image/x-icon") {
      applyDirectIconUrl(iconUrl, type);
      return;
    }

    await applyRasterIconUrl(iconUrl);
  }

  async function applyBranding() {
    try {
      if (hasLocalBrandingFavicon()) {
        return;
      }

      if (explicitIconUrl && explicitIconUrl !== "__BRANDING_ICON_URL__") {
        await applyIconUrl(explicitIconUrl);
        return;
      }

      var response = await fetch(appConfigPath + "?v=" + Date.now(), {
        credentials: "same-origin"
      });

      if (!response.ok) {
        return;
      }

      var payload = await response.json();
      var logoUrl = payload && payload.brandingSettings && payload.brandingSettings.logoUrl;

      await applyIconUrl(logoUrl);
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
