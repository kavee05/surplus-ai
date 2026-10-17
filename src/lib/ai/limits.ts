/**
 * Usage limits for live AI: a per-IP window and a global daily cap.
 * Uses Upstash Redis over REST when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (shared across serverless instances).
 * Otherwise falls back to memory, which is best-effort: each serverless
 * instance keeps its own counts.
 */

export interface CounterStore {
  /** Increment a key, set its expiry on first use, return the new count. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  readonly shared: boolean;
}

export function memoryStore(now: () => number = Date.now): CounterStore {
  const m = new Map<string, { n: number; exp: number }>();
  return {
    shared: false,
    async incr(key, ttl) {
      const t = now();
      const cur = m.get(key);
      if (!cur || cur.exp <= t) {
        m.set(key, { n: 1, exp: t + ttl * 1000 });
        return 1;
      }
      cur.n += 1;
      return cur.n;
    },
  };
}

export function upstashStore(url: string, token: string): CounterStore {
  return {
    shared: true,
    async incr(key, ttl) {
      const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, String(ttl), "NX"],
        ]),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error(`upstash ${res.status}`);
      const json = (await res.json()) as { result: number }[];
      return Number(json[0]?.result ?? 0);
    },
  };
}

let fallback: CounterStore | null = null;
export function defaultStore(env: Record<string, string | undefined> = process.env): CounterStore {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return upstashStore(url, token);
  fallback ??= memoryStore();
  return fallback;
}

export type LimitResult = { ok: true; usedToday: number } | { ok: false; reason: "ip" | "daily"; message: string };

const day = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Counts one live AI call. Call only when a real provider request is about to happen. */
export async function checkLimits(
  store: CounterStore,
  ip: string,
  opts: { perIp: number; perIpWindowSeconds?: number; dailyCap: number; now?: number },
): Promise<LimitResult> {
  const now = opts.now ?? Date.now();
  const window = opts.perIpWindowSeconds ?? 600;
  const bucket = Math.floor(now / (window * 1000));
  try {
    const ipCount = await store.incr(`ai:ip:${ip}:${bucket}`, window);
    if (ipCount > opts.perIp) return { ok: false, reason: "ip", message: "Too many live AI requests from this connection. Try again in a few minutes." };
    const used = await store.incr(`ai:day:${day(now)}`, 60 * 60 * 26);
    if (used > opts.dailyCap) return { ok: false, reason: "daily", message: "The daily live AI allowance for this demo is used up. Demo mode is on until tomorrow." };
    return { ok: true, usedToday: used };
  } catch {
    // If the shared store is down, fail closed to protect the API budget.
    return { ok: false, reason: "daily", message: "Live AI is paused because the usage counter is unavailable. Demo mode is on." };
  }
}
