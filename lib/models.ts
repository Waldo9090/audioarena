export interface Model {
  name: string
  initial: string
  // tailwind classes for the small icon badge
  badge: string
}

export const models: Model[] = [
  { name: 'Opus 4.8', initial: 'C', badge: 'bg-[#d97757] text-white' },
  { name: 'GLM 5.2', initial: 'Z', badge: 'bg-[#3b6fd4] text-white' },
  { name: 'GPT-5.5', initial: 'G', badge: 'bg-foreground text-background' },
  { name: 'Claude', initial: 'C', badge: 'bg-[#d97757] text-white' },
  { name: 'DeepSeek', initial: 'D', badge: 'bg-[#4b5bd4] text-white' },
  { name: 'GPT-5', initial: 'G', badge: 'bg-foreground text-background' },
  { name: 'Gemini 3', initial: 'G', badge: 'bg-[#c98a3a] text-white' },
]
