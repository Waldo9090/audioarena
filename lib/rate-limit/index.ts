import "server-only";

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env, envNumber, isProduction } from "@/lib/env";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export type RateLimitEventType = "generation" | "vote";

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function hashIp(ip: string) {
  const salt = env("IP_HASH_SALT");
  if (!salt && isProduction()) {
    throw new Error("Missing required environment variable: IP_HASH_SALT");
  }

  return crypto
    .createHmac("sha256", salt || "dev-only-ip-hash-salt")
    .update(ip)
    .digest("hex");
}

async function countEvents(
  supabase: SupabaseClient,
  filters: {
    eventType: RateLimitEventType;
    userId?: string;
    ipHash?: string;
    since: Date;
  }
) {
  let query = supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", filters.eventType)
    .gte("created_at", filters.since.toISOString());

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.ipHash) {
    query = query.eq("ip_hash", filters.ipHash);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count || 0;
}

export async function enforceRateLimit(
  supabase: SupabaseClient,
  options: {
    eventType: RateLimitEventType;
    userId: string;
    ipHash?: string;
  }
) {
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  if (options.eventType === "generation") {
    const userHourLimit = envNumber("RATE_LIMIT_GENERATIONS_USER_HOUR", 20);
    const userDayLimit = envNumber("RATE_LIMIT_GENERATIONS_USER_DAY", 100);
    const ipHourLimit = envNumber("RATE_LIMIT_GENERATIONS_IP_HOUR", 50);

    const [userHour, userDay, ipHour] = await Promise.all([
      countEvents(supabase, {
        eventType: "generation",
        userId: options.userId,
        since: hourAgo
      }),
      countEvents(supabase, {
        eventType: "generation",
        userId: options.userId,
        since: dayAgo
      }),
      options.ipHash
        ? countEvents(supabase, {
            eventType: "generation",
            ipHash: options.ipHash,
            since: hourAgo
          })
        : Promise.resolve(0)
    ]);

    if (userHour >= userHourLimit) {
      throw new RateLimitError("You reached the hourly generation limit. Try again later.");
    }

    if (userDay >= userDayLimit) {
      throw new RateLimitError("You reached the daily generation limit. Try again tomorrow.");
    }

    if (options.ipHash && ipHour >= ipHourLimit) {
      throw new RateLimitError("This network reached the hourly generation limit.");
    }
  }

  if (options.eventType === "vote") {
    const voteDayLimit = envNumber("RATE_LIMIT_VOTES_USER_DAY", 200);
    const userDay = await countEvents(supabase, {
      eventType: "vote",
      userId: options.userId,
      since: dayAgo
    });

    if (userDay >= voteDayLimit) {
      throw new RateLimitError("You reached the daily voting limit. Try again tomorrow.");
    }
  }

  const { error } = await supabase.from("rate_limit_events").insert({
    event_type: options.eventType,
    user_id: options.userId,
    ip_hash: options.ipHash || null
  });

  if (error) {
    throw error;
  }
}
