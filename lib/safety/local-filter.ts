export type LocalFilterResult = {
  blocked: boolean;
  reason?: string;
};

const bannedPatterns: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: "sexual content involving minors",
    pattern:
      /\b(child|children|minor|underage|kid|kids|toddler|preteen|teen(?:ager)?|1[0-7]\s*(?:year|yr)s?\s*old)\b[\s\S]{0,100}\b(sex|sexual|nude|naked|porn|erotic|molest|rape|explicit)\b/i
  },
  {
    reason: "sexual content involving minors",
    pattern:
      /\b(sex|sexual|nude|naked|porn|erotic|molest|rape|explicit)\b[\s\S]{0,100}\b(child|children|minor|underage|kid|kids|toddler|preteen|teen(?:ager)?|1[0-7]\s*(?:year|yr)s?\s*old)\b/i
  },
  {
    reason: "hateful threats",
    pattern:
      /\b(kill|murder|shoot|lynch|gas|exterminate|wipe out)\b[\s\S]{0,100}\b(jews|muslims|christians|hindus|black people|white people|asians|immigrants|gay people|trans people|disabled people)\b/i
  },
  {
    reason: "graphic violent instructions",
    pattern:
      /\b(how to|steps to|instructions for|teach me to|guide to)\b[\s\S]{0,120}\b(build|make|detonate|poison|torture|dismember|behead|stab|shoot|murder|kill)\b/i
  },
  {
    reason: "extremist praise or recruitment",
    pattern:
      /\b(join|recruit|support|praise|pledge allegiance to|glorify)\b[\s\S]{0,100}\b(isis|isil|al[-\s]?qaeda|terrorist organization|neo[-\s]?nazi|white supremacist militia)\b/i
  },
  {
    reason: "explicit abuse",
    pattern: /\b(rape|molest|torture|behead|dismember)\b/i
  },
  {
    reason: "self-harm instructions",
    pattern:
      /\b(how to|best way to|instructions for|teach me to)\b[\s\S]{0,100}\b(kill myself|die by suicide|self[-\s]?harm|cut myself|overdose)\b/i
  }
];

export function runLocalSafetyFilter(text: string): LocalFilterResult {
  for (const { reason, pattern } of bannedPatterns) {
    if (pattern.test(text)) {
      return { blocked: true, reason };
    }
  }

  return { blocked: false };
}
