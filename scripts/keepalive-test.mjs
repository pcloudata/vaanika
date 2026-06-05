import fs from 'node:fs';
import path from 'node:path';

loadEnvLocal();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/keepalive_ping`;

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_source: 'local-test' }),
}).catch((error) => {
  console.error(`Keepalive request failed before Supabase responded: ${error.message}`);
  if (error.cause?.code) {
    console.error(`Network error code: ${error.cause.code}`);
  }
  process.exit(1);
});

const responseText = await response.text();

if (!response.ok) {
  console.error(`Keepalive failed: HTTP ${response.status}`);
  if (response.status === 404) {
    console.error('The keepalive_ping RPC was not found. Run `npm run db:push` first, then retry.');
  } else {
    console.error(responseText);
  }
  process.exit(1);
}

console.log(`Keepalive passed. Supabase returned: ${responseText}`);

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
}
