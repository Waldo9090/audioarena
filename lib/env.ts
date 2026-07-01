export function env(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function requireEnv(name: string) {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function envNumber(name: string, fallback: number) {
  const value = env(name);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
