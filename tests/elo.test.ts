import { describe, expect, it } from "vitest";

import {
  calculateElo,
  eloConfidenceRadius95,
  expectedScore,
  isPreliminaryElo
} from "@/lib/elo";

describe("Elo utilities", () => {
  it("returns 0.5 expected score for equal ratings", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 8);
  });

  it("updates equal ratings by 16 points with K=32", () => {
    const result = calculateElo(1000, 1000, 32);

    expect(result.winnerEloAfter).toBeCloseTo(1016, 8);
    expect(result.loserEloAfter).toBeCloseTo(984, 8);
  });

  it("gives a higher-rated winner a smaller gain", () => {
    const result = calculateElo(1200, 1000, 32);

    expect(result.winnerEloAfter).toBeGreaterThan(1200);
    expect(result.winnerEloAfter).toBeLessThan(1216);
    expect(result.loserEloAfter).toBeLessThan(1000);
  });

  it("shrinks the 95% Elo confidence interval as battles accumulate", () => {
    expect(eloConfidenceRadius95(0)).toBeGreaterThan(eloConfidenceRadius95(100));
    expect(eloConfidenceRadius95(100)).toBeGreaterThanOrEqual(10);
  });

  it("marks ratings preliminary while the 95% interval is wide", () => {
    expect(isPreliminaryElo(0)).toBe(true);
    expect(isPreliminaryElo(30)).toBe(true);
    expect(isPreliminaryElo(50)).toBe(false);
  });
});
