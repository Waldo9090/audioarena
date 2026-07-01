import {
  PollyClient,
  SynthesizeSpeechCommand,
  type Engine,
  type VoiceId
} from "@aws-sdk/client-polly";

import { env } from "@/lib/env";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

async function streamToBuffer(stream: unknown) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export const amazonPollyAdapter: TTSProviderAdapter = {
  id: "amazon_polly",
  isConfigured() {
    return Boolean(env("AWS_ACCESS_KEY_ID") && env("AWS_SECRET_ACCESS_KEY") && env("AWS_REGION"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const region = env("AWS_REGION");
    const accessKeyId = env("AWS_ACCESS_KEY_ID");
    const secretAccessKey = env("AWS_SECRET_ACCESS_KEY");

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error("AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION are required.");
    }

    const started = Date.now();
    const client = new PollyClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const response = await client.send(
      new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: "mp3",
        VoiceId: (model.default_voice || "Joanna") as VoiceId,
        Engine: (model.api_model_name || "neural") as Engine
      })
    );

    if (!response.AudioStream) {
      throw new Error("Amazon Polly did not return an audio stream.");
    }

    return {
      audioBuffer: await streamToBuffer(response.AudioStream),
      mimeType: "audio/mpeg",
      generationMs: Date.now() - started
    };
  }
};
