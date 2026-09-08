#!/bin/sh
set -eu

echo "Starting entrypoint script..."
export INTERNAL_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

if [ "${BRANDING_ICON_URL:-}" != "" ]; then
  export BRANDING_ICON_URL_CLEAN=$(printf '%s' "$BRANDING_ICON_URL" | sed 's/^"//; s/"$//')
fi

if [ "${BRANDING_ICON_URL:-}" != "" ] && [ -f /opt/app/frontend/assets/branding-runtime.js ]; then
  node <<'EOF'
const fs = require("fs");

const runtimePath = "/opt/app/frontend/assets/branding-runtime.js";
const iconUrl = process.env.BRANDING_ICON_URL_CLEAN;

if (iconUrl && fs.existsSync(runtimePath)) {
  let runtimeJs = fs.readFileSync(runtimePath, "utf8");
  runtimeJs = runtimeJs.replace(/__BRANDING_ICON_URL__/g, iconUrl);
  fs.writeFileSync(runtimePath, runtimeJs, "utf8");
}
EOF
fi

node /opt/app/generate-favicon.mjs
node /opt/app/apply-theme.mjs

echo "Entrypoint script completed."
exec "$@"
