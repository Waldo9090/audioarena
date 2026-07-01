import "server-only";

import { env } from "@/lib/env";
import { runLocalSafetyFilter } from "@/lib/safety/local-filter";

type ModerationResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
  }>;
};

export type ModerationResult = {
  allowed: boolean;
  message?: string;
};

const blockedMessage =
  "That text is not safe for speech generation. Try a different prompt that avoids explicit abuse, hateful threats, self-harm instructions, extremist recruitment, or sexual content involving minors.";

export async function moderateTextForSpeech(text: string): Promise<ModerationResult> {
  const local = runLocalSafetyFilter(text);
  if (local.blocked) {
    return { allowed: false, message: blockedMessage };
  }

  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) {
    return {
      allowed: false,
      message:
        "Speech generation safety checks are not configured yet. Set OPENAI_API_KEY on the server."
    };
  }

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI moderation failed with status ${response.status}`);
  }

  const moderation = (await response.json()) as ModerationResponse;
  const flagged = moderation.results?.some((result) => result.flagged);

  if (flagged) {
    return { allowed: false, message: blockedMessage };
  }

  return { allowed: true };
}
