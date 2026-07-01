import { env } from "@/lib/env";
import { fetchAudio, getVoice, xmlEscape } from "@/lib/tts/adapters/common";
import type { TTSProviderAdapter } from "@/lib/tts/types";

function azureEndpoint() {
  const explicit = env("AZURE_SPEECH_ENDPOINT");
  if (explicit) {
    return explicit.endsWith("/cognitiveservices/v1")
      ? explicit
      : `${explicit.replace(/\/+$/, "")}/cognitiveservices/v1`;
  }

  const region = env("AZURE_SPEECH_REGION");
  return region ? `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1` : undefined;
}

export const azureAdapter: TTSProviderAdapter = {
  id: "azure",
  isConfigured() {
    return Boolean(env("AZURE_SPEECH_KEY") && azureEndpoint());
  },
  synthesize({ text, model }) {
    const apiKey = env("AZURE_SPEECH_KEY");
    const endpoint = azureEndpoint();

    if (!apiKey || !endpoint) {
      throw new Error("AZURE_SPEECH_KEY and AZURE_SPEECH_REGION or AZURE_SPEECH_ENDPOINT are required.");
    }

    const voice = getVoice(model.default_voice, "en-US-AvaMultilingualNeural");
    const ssml = `<speak version="1.0" xml:lang="en-US"><voice name="${xmlEscape(
      voice
    )}">${xmlEscape(text)}</voice></speak>`;

    return fetchAudio("azure", endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "audioarena.ai"
      },
      body: ssml
    });
  }
};
