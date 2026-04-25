FROM remnawave/subscription-page:latest

COPY docker/apply-theme.mjs /opt/app/apply-theme.mjs
COPY docker/branding-runtime.js /opt/app/frontend/assets/branding-runtime.js
COPY docker/custom-entrypoint.sh /opt/app/custom-entrypoint.sh

RUN set -eux; \
    html_file="/opt/app/frontend/index.html"; \
    runtime_file="/opt/app/frontend/assets/branding-runtime.js"; \
    if [ ! -f "$html_file" ]; then \
      echo "Required frontend assets were not found"; \
      exit 1; \
    fi; \
    chmod +x /opt/app/custom-entrypoint.sh; \
    if [ ! -f "$runtime_file" ]; then \
      echo "Branding runtime asset was not found"; \
      exit 1; \
    fi; \
    sed -i 's#</head>#<link rel="stylesheet" href="/assets/theme-overrides.css" />\n    <script src="/assets/branding-runtime.js"></script>\n    </head>#' "$html_file"

ENTRYPOINT ["/bin/sh", "/opt/app/custom-entrypoint.sh"]
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
