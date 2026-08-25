import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * Self-hosted Workers (e.g. `wrangler deploy`) do not receive the project's
 * `.env` file, so server-only Supabase vars can be missing at runtime. Bridge
 * them from the Worker bindings, then from the build-time injected VITE_ values
 * (public URL + publishable key only — never a service role key).
 */
function bridgeSupabaseEnv(env: unknown) {
  const bindings = (env ?? {}) as Record<string, string | undefined>;
  const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;
  if (!globalProcess?.env) return;
  const target = globalProcess.env;

  const fallbacks: Record<string, string | undefined> = {
    SUPABASE_URL: bindings["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"],
    SUPABASE_PUBLISHABLE_KEY:
      bindings["SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
    SUPABASE_PROJECT_ID:
      bindings["SUPABASE_PROJECT_ID"] ?? import.meta.env["VITE_SUPABASE_PROJECT_ID"],
    SUPABASE_SERVICE_ROLE_KEY: bindings["SUPABASE_SERVICE_ROLE_KEY"],
  };

  for (const [key, value] of Object.entries(fallbacks)) {
    if (!target[key] && value) target[key] = value;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    bridgeSupabaseEnv(env);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
