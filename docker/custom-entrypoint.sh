#!/bin/sh
set -eu

echo "Starting entrypoint script..."
export INTERNAL_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

if [ "${BRANDING_ICON_URL:-}" != "" ]; then
  export BRANDING_ICON_URL_CLEAN=$(printf '%s' "$BRANDING_ICON_URL" | sed 's/^"//; s/"$//')

  node <<'EOF'
const fs = require("fs");

const htmlPath = "/opt/app/frontend/index.html";
const runtimePath = "/opt/app/frontend/assets/branding-runtime.js";
const iconUrl = process.env.BRANDING_ICON_URL_CLEAN;

if (iconUrl && fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace(/(<link rel="icon"[^>]*href=")([^"]*)(")/g, `$1${iconUrl}$3`);
  html = html.replace(/(<link rel="apple-touch-icon"[^>]*href=")([^"]*)(")/g, `$1${iconUrl}$3`);

  if (html.includes('rel="shortcut icon"')) {
    html = html.replace(/(<link rel="shortcut icon"[^>]*href=")([^"]*)(")/g, `$1${iconUrl}$3`);
  } else {
    html = html.replace("</head>", `    <link rel="shortcut icon" href="${iconUrl}" />\n    </head>`);
  }

  fs.writeFileSync(htmlPath, html, "utf8");
}

if (iconUrl && fs.existsSync(runtimePath)) {
  let runtimeJs = fs.readFileSync(runtimePath, "utf8");
  runtimeJs = runtimeJs.replace(/__BRANDING_ICON_URL__/g, iconUrl);
  fs.writeFileSync(runtimePath, runtimeJs, "utf8");
}
EOF
fi

node /opt/app/apply-theme.mjs

echo "Entrypoint script completed."
exec "$@"
