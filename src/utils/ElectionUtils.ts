import { Election, PairwiseResult } from '../types';

export const getPairwiseResults = (election: Election): PairwiseResult[] => {
  const results: PairwiseResult[] = [];

  for (let i = 0; i < election.candidates.length; i++) {
    for (let j = i + 1; j < election.candidates.length; j++) {
      const candidate1 = election.candidates[i];
      const candidate2 = election.candidates[j];

      let candidate1Wins = 0;
      let candidate2Wins = 0;

      election.votes.forEach(vote => {
        const pos1 = vote.ranking.indexOf(candidate1.id);
        const pos2 = vote.ranking.indexOf(candidate2.id);

        if (pos1 < pos2) {
          candidate1Wins++;
        } else if (pos2 < pos1) {
          candidate2Wins++;
        }
      });

      results.push({
        candidate1: candidate1.name,
        candidate2: candidate2.name,
        candidate1Votes: candidate1Wins,
        candidate2Votes: candidate2Wins
      });
    }
  }

  return results;
};

export const getHeadToHeadVictories = (pairwiseResults: PairwiseResult[]) => {
  const victories: { winner: string; loser: string; margin: number }[] = [];

  pairwiseResults.forEach(result => {
    if (result.candidate1Votes > result.candidate2Votes) {
      victories.push({
        winner: result.candidate1,
        loser: result.candidate2,
        margin: result.candidate1Votes - result.candidate2Votes
      });
    } else if (result.candidate2Votes > result.candidate1Votes) {
      victories.push({
        winner: result.candidate2,
        loser: result.candidate1,
        margin: result.candidate2Votes - result.candidate1Votes
      });
    }
  });

  return victories;
};

export const calculateSmithSet = (victories: { winner: string; loser: string; margin: number }[]): string[] => {
  // Get unique candidates from victories
  const candidates = new Set(
    victories.flatMap(v => [v.winner, v.loser])
  );

  const defeats: Record<string, string[]> = {};

  // Initialize defeats object
  candidates.forEach(candidate => {
    defeats[candidate] = [];
  });

  // Record who defeats whom
  victories.forEach(result => {
    defeats[result.winner].push(result.loser);
  });

  // Find candidates that are beaten by everyone not in the current set
  const findBeatenByAll = (candidateSet: Set<string>): string[] => {
    return Array.from(candidateSet).filter(candidate => {
      const others = Array.from(candidateSet).filter(c => c !== candidate);
      return others.every(other =>
        defeats[other].includes(candidate) && !defeats[candidate].includes(other)
      );
    });
  };

  // Iteratively remove candidates beaten by all others until no more can be removed
  let currentSet = new Set(candidates);
  let beatenCandidates: string[];

  do {
    beatenCandidates = findBeatenByAll(currentSet);
    beatenCandidates.forEach(candidate => currentSet.delete(candidate));
  } while (beatenCandidates.length > 0);

  return Array.from(currentSet);
};
