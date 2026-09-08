import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const assetsDir = "/opt/app/frontend/assets";
const htmlPath = "/opt/app/frontend/index.html";
const faviconSizes = [32, 48, 64, 128, 180];

function cleanValue(value) {
  return String(value || "").trim().replace(/^"|"$/g, "");
}

function isPlaceholderLogo(url) {
  return !url || url.includes("docs.rw");
}

function buildPanelHeaders() {
  const headers = {
    "user-agent": "Remnawave Subscription Page",
    Accept: "application/json",
  };

  const token = cleanValue(process.env.REMNAWAVE_API_TOKEN);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const caddyToken = cleanValue(process.env.CADDY_AUTH_API_TOKEN);
  if (caddyToken) {
    headers["X-Api-Key"] = caddyToken;
  }

  const cfId = cleanValue(process.env.CLOUDFLARE_ZERO_TRUST_CLIENT_ID);
  const cfSecret = cleanValue(process.env.CLOUDFLARE_ZERO_TRUST_CLIENT_SECRET);
  if (cfId && cfSecret) {
    headers["CF-Access-Client-Id"] = cfId;
    headers["CF-Access-Client-Secret"] = cfSecret;
  }

  return headers;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

async function resolveLogoUrl() {
  const explicitUrl = cleanValue(process.env.BRANDING_ICON_URL_CLEAN);

  if (explicitUrl) {
    return explicitUrl;
  }

  const panelUrl = cleanValue(process.env.REMNAWAVE_PANEL_URL).replace(/\/$/, "");
  const token = cleanValue(process.env.REMNAWAVE_API_TOKEN);

  if (!panelUrl || !token) {
    return null;
  }

  const headers = buildPanelHeaders();
  const listPayload = await fetchJson(`${panelUrl}/api/subscription-page-configs`, headers);
  const configs = listPayload?.response?.configs || [];
  const preferredUuid =
    cleanValue(process.env.SUBPAGE_CONFIG_UUID) ||
    configs.find((item) => item?.uuid)?.uuid;

  if (!preferredUuid) {
    return null;
  }

  const configPayload = await fetchJson(
    `${panelUrl}/api/subscription-page-configs/${encodeURIComponent(preferredUuid)}`,
    headers
  );

  return configPayload?.response?.config?.brandingSettings?.logoUrl || null;
}

async function downloadLogo(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Logo download failed (${response.status}) for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function patchHtml() {
  if (!fs.existsSync(htmlPath)) {
    return;
  }

  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace(/\n\s*<link rel="(?:icon|apple-touch-icon|shortcut icon)"[^>]*>/g, "");

  const links = [
    `    <link rel="icon" type="image/png" sizes="128x128" href="/assets/branding-favicon-128.png" />`,
    `    <link rel="icon" type="image/png" sizes="64x64" href="/assets/branding-favicon-64.png" />`,
    `    <link rel="icon" type="image/png" sizes="48x48" href="/assets/branding-favicon-48.png" />`,
    `    <link rel="icon" type="image/png" sizes="32x32" href="/assets/branding-favicon-32.png" />`,
    `    <link rel="shortcut icon" type="image/png" href="/assets/branding-favicon-64.png" />`,
    `    <link rel="apple-touch-icon" sizes="180x180" href="/assets/branding-favicon-180.png" />`,
  ].join("\n");

  html = html.replace("</head>", `${links}\n    </head>`);
  fs.writeFileSync(htmlPath, html, "utf8");
}

async function generateFavicons(logoUrl) {
  const logoBuffer = await downloadLogo(logoUrl);
  const trimmed = sharp(logoBuffer).trim({ threshold: 20 });

  for (const size of faviconSizes) {
    await trimmed
      .clone()
      .resize(size, size, {
        fit: "cover",
        position: "centre",
      })
      .png()
      .toFile(path.join(assetsDir, `branding-favicon-${size}.png`));
  }

  patchHtml();
  console.log(`Generated branding favicons from ${logoUrl}`);
}

async function main() {
  try {
    const logoUrl = await resolveLogoUrl();

    if (isPlaceholderLogo(logoUrl)) {
      console.log("Branding favicon generation skipped: logo URL is not configured");
      return;
    }

    await generateFavicons(logoUrl);
  } catch (error) {
    console.warn(`Branding favicon generation skipped: ${error.message}`);
  }
}

await main();
