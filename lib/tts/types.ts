import type { ModelRow } from "@/lib/db/types";

export type TTSModelConfig = Pick<
  ModelRow,
  | "id"
  | "display_name"
  | "provider"
  | "adapter"
  | "api_model_name"
  | "default_voice"
>;

export type SynthesizeInput = {
  text: string;
  model: TTSModelConfig;
};

export type SynthesizeResult = {
  audioBuffer: Buffer;
  mimeType: string;
  generationMs: number;
};

export interface TTSProviderAdapter {
  id: string;
  synthesize(input: SynthesizeInput): Promise<SynthesizeResult>;
  isConfigured(): boolean;
}
