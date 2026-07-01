import crypto from "node:crypto";

export const MAX_TEXT_LENGTH = 1000;

export function normalizeBattleText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

export function hashText(text: string) {
  return crypto.createHash("sha256").update(normalizeBattleText(text)).digest("hex");
}

export function validateArenaText(text: unknown) {
  if (typeof text !== "string") {
    return { ok: false as const, message: "Enter text to synthesize." };
  }

  const normalized = normalizeBattleText(text);

  if (!normalized) {
    return { ok: false as const, message: "Enter text to synthesize." };
  }

  if (normalized.length > MAX_TEXT_LENGTH) {
    return {
      ok: false as const,
      message: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`
    };
  }

  return { ok: true as const, text: normalized };
}
