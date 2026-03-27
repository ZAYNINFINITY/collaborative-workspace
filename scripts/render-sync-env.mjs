import fs from "node:fs";
import path from "node:path";

const parseArgs = (argv) => {
  const args = {
    serviceId: process.env.RENDER_SERVICE_ID || "",
    apiKey: process.env.RENDER_API_KEY || "",
    envFile: "backend/.env",
    exampleFile: "backend/.env.example",
    dryRun: false,
    onlyExampleKeys: true,
    includeKeys: [],
    allowEmpty: false,
    restart: false,
    skipKeys: ["PORT"],
    noDefaultSkips: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--service" || token === "--service-id") {
      args.serviceId = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--api-key") {
      args.apiKey = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--env-file") {
      args.envFile = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--example-file") {
      args.exampleFile = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--all-keys") {
      args.onlyExampleKeys = false;
      continue;
    }
    if (token === "--only-example-keys") {
      args.onlyExampleKeys = true;
      continue;
    }
    if (token === "--include") {
      const raw = argv[i + 1] || "";
      args.includeKeys = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--allow-empty") {
      args.allowEmpty = true;
      continue;
    }
    if (token === "--restart") {
      args.restart = true;
      continue;
    }
    if (token === "--skip") {
      const raw = argv[i + 1] || "";
      args.skipKeys = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--no-default-skips") {
      args.noDefaultSkips = true;
      continue;
    }
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
  }

  return args;
};

const usage = () => `
Render env sync (safe)

Reads an env file and pushes env vars to a Render service via the Render API.
By default, it only uploads keys present in backend/.env.example (allowlist).

Usage:
  node scripts/render-sync-env.mjs --service <SERVICE_ID> [--dry-run] [--restart]

Options:
  --service, --service-id   Render service ID (or set RENDER_SERVICE_ID)
  --api-key                 Render API key (or set RENDER_API_KEY)
  --env-file                Env file to read (default: backend/.env)
  --example-file            Example file for allowlist (default: backend/.env.example)
  --only-example-keys       Only upload keys that exist in example file (default)
  --all-keys                Upload every key found in env file (not recommended)
  --include                 Comma-separated extra keys to allow even if not in example
  --allow-empty             Upload empty values (default: skip empty)
  --skip                    Comma-separated keys to skip (default: PORT)
  --no-default-skips        Disable default skip list
  --dry-run                 Print keys to be uploaded (never prints values)
  --restart                 Restart service after setting env vars
`.trim();

const parseEnvFile = (content) => {
  const out = new Map();
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const cleaned = line.startsWith("export ") ? line.slice("export ".length) : line;
    const eqIndex = cleaned.indexOf("=");
    if (eqIndex === -1) continue;
    const key = cleaned.slice(0, eqIndex).trim();
    if (!key) continue;
    let value = cleaned.slice(eqIndex + 1);
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.set(key, value);
  }
  return out;
};

const fileExists = (p) => {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  if (!args.serviceId) {
    console.error("Missing --service <SERVICE_ID> (or set RENDER_SERVICE_ID).");
    console.error(usage());
    process.exit(2);
  }
  if (!args.apiKey) {
    console.error("Missing Render API key. Set RENDER_API_KEY or pass --api-key.");
    process.exit(2);
  }

  const envFilePath = path.resolve(process.cwd(), args.envFile);
  if (!fileExists(envFilePath)) {
    console.error(`Env file not found: ${envFilePath}`);
    process.exit(2);
  }
  const envVars = parseEnvFile(fs.readFileSync(envFilePath, "utf8"));

  let allowedKeys = null;
  if (args.onlyExampleKeys) {
    const examplePath = path.resolve(process.cwd(), args.exampleFile);
    if (!fileExists(examplePath)) {
      console.error(`Example file not found for allowlist: ${examplePath}`);
      process.exit(2);
    }
    const exampleVars = parseEnvFile(fs.readFileSync(examplePath, "utf8"));
    allowedKeys = new Set([...exampleVars.keys(), ...args.includeKeys]);
  }

  const defaultSkip = ["PORT"];
  const skipSet = new Set(
    args.noDefaultSkips ? args.skipKeys : [...new Set([...defaultSkip, ...args.skipKeys])],
  );

  const entries = [...envVars.entries()]
    .filter(([key]) => (allowedKeys ? allowedKeys.has(key) : true))
    .filter(([key]) => !skipSet.has(key))
    .filter(([, value]) => (args.allowEmpty ? true : value !== ""));

  if (entries.length === 0) {
    console.log("No env vars to upload (after filtering).");
    process.exit(0);
  }

  if (args.dryRun) {
    console.log(`Will upload ${entries.length} env var(s) to ${args.serviceId}:`);
    for (const [key] of entries) console.log(`- ${key}`);
    process.exit(0);
  }

  const headers = {
    Authorization: `Bearer ${args.apiKey}`,
    "Content-Type": "application/json",
  };

  let okCount = 0;
  for (const [key, value] of entries) {
    const url = `https://api.render.com/v1/services/${encodeURIComponent(
      args.serviceId,
    )}/env-vars/${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ value }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to set ${key}: HTTP ${res.status} ${text}`);
    }

    okCount += 1;
  }

  console.log(`Uploaded ${okCount}/${entries.length} env var(s).`);

  if (args.restart) {
    const restartUrl = `https://api.render.com/v1/services/${encodeURIComponent(
      args.serviceId,
    )}/restart`;
    const res = await fetch(restartUrl, { method: "POST", headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Restart failed: HTTP ${res.status} ${text}`);
    }
    console.log("Restart triggered.");
  }
};

main().catch((err) => {
  console.error(String(err?.message || err));
  process.exit(1);
});
