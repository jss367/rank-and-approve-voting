import { Election, PairwiseResult } from '../types';

export const getPairwiseResults = (election: Election): PairwiseResult[] => {
  const results: PairwiseResult[] = [];

  // For each pair of candidates
  for (let i = 0; i < election.candidates.length; i++) {
    for (let j = i + 1; j < election.candidates.length; j++) {
      const candidate1 = election.candidates[i];
      const candidate2 = election.candidates[j];

      let candidate1Votes = 0;
      let candidate2Votes = 0;

      // Count each vote where both candidates are ranked
      election.votes.forEach(vote => {
        const pos1 = vote.ranking.indexOf(candidate1.id);
        const pos2 = vote.ranking.indexOf(candidate2.id);

        // Only count if at least one candidate is ranked
        // Unranked candidates are considered lower preference
        if (pos1 === -1 && pos2 === -1) {
          return; // Skip if neither is ranked
        }
        if (pos1 === -1) {
          candidate2Votes++;
        } else if (pos2 === -1) {
          candidate1Votes++;
        } else if (pos1 < pos2) {
          candidate1Votes++;
        } else {
          candidate2Votes++;
        }
      });

      results.push({
        candidate1: candidate1.name,
        candidate2: candidate2.name,
        candidate1Votes,
        candidate2Votes
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
    } else {
      // It's a tie - add both directions with margin 0
      victories.push(
        {
          winner: result.candidate1,
          loser: result.candidate2,
          margin: 0
        },
        {
          winner: result.candidate2,
          loser: result.candidate1,
          margin: 0
        }
      );
    }
  });

  // Sort by winner name for consistent test results
  return victories.sort((a, b) => a.winner.localeCompare(b.winner));
};

export const calculateSmithSet = (victories: { winner: string; loser: string; margin: number }[]): string[] => {
  // Get all candidates
  const candidates = Array.from(new Set(victories.flatMap(v => [v.winner, v.loser])));

  // Create defeat graph including ties
  const defeats = new Map<string, Map<string, number>>();
  candidates.forEach(c => defeats.set(c, new Map()));

  // Fill in all victories and ties
  victories.forEach(v => {
    // Store the margin of victory/tie
    defeats.get(v.winner)?.set(v.loser, v.margin);
  });

  // Helper function: does A beat or tie with B?
  const beatsOrTies = (a: string, b: string): boolean => {
    const margin = defeats.get(a)?.get(b);
    return margin !== undefined && margin >= 0;
  };

  // Helper function: does A strictly beat B?
  const strictlyBeats = (a: string, b: string): boolean => {
    const margin = defeats.get(a)?.get(b);
    return margin !== undefined && margin > 0;
  };

  // Helper function: can candidate A reach candidate B through victories or ties?
  const canReach = (start: string, target: string, visited = new Set<string>()): boolean => {
    if (start === target) return true;
    if (visited.has(start)) return false;

    visited.add(start);
    const neighbors = Array.from(candidates).filter(c => beatsOrTies(start, c));

    return neighbors.some(n => canReach(n, target, visited));
  };

  // A candidate should be in the Smith set if:
  // 1. It can reach every other candidate through a path of victories/ties
  // 2. No candidate outside the set strictly beats all candidates in the set
  const isInSmithSet = (candidate: string): boolean => {
    // Can this candidate reach all others?
    const canReachAll = candidates.every(other =>
      candidate === other || canReach(candidate, other)
    );

    // Is this candidate part of a mutual-reachability group?
    const mutuallyReachable = candidates.filter(other =>
      candidate === other ||
      (canReach(candidate, other) && canReach(other, candidate))
    );

    // No candidate outside the mutually reachable group should
    // strictly beat everyone in the group
    const noOutsideDomination = candidates.every(outside =>
      mutuallyReachable.includes(outside) ||
      !mutuallyReachable.every(inside => strictlyBeats(outside, inside))
    );

    return canReachAll && noOutsideDomination;
  };

  // Calculate Smith set
  const smithSet = candidates.filter(isInSmithSet);

  // If empty (shouldn't happen with valid input), return all candidates
  return smithSet.length > 0 ? smithSet.sort() : candidates.sort();
};
