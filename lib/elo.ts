export type EloResult = {
  winnerEloAfter: number;
  loserEloAfter: number;
  winnerExpected: number;
  loserExpected: number;
};

export const PRELIMINARY_ELO_CI_THRESHOLD = 50;

export function expectedScore(playerElo: number, opponentElo: number) {
  return 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
}

export function calculateElo(
  winnerElo: number,
  loserElo: number,
  kFactor = 32
): EloResult {
  const winnerExpected = expectedScore(winnerElo, loserElo);
  const loserExpected = expectedScore(loserElo, winnerElo);

  return {
    winnerExpected,
    loserExpected,
    winnerEloAfter: winnerElo + kFactor * (1 - winnerExpected),
    loserEloAfter: loserElo + kFactor * (0 - loserExpected)
  };
}

export function eloConfidenceRadius95(battles: number) {
  const effectiveBattles = Math.max(1, battles);
  const eloLogitScale = 400 / Math.log(10);
  return Math.ceil((1.96 * eloLogitScale) / Math.sqrt(effectiveBattles));
}

export function isPreliminaryElo(battles: number) {
  return eloConfidenceRadius95(battles) > PRELIMINARY_ELO_CI_THRESHOLD;
}
