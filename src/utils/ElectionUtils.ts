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

        // Only count if both candidates are ranked
        if (pos1 !== -1 && pos2 !== -1) {
          if (pos1 < pos2) {
            candidate1Wins++;
          } else {
            candidate2Wins++;
          }
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
    // In case of a tie, no victory is recorded
  });

  return victories;
};

export const calculateSmithSet = (victories: { winner: string; loser: string; margin: number }[]): string[] => {
  // Get unique candidates
  const candidates = Array.from(new Set(victories.flatMap(v => [v.winner, v.loser])));
  if (candidates.length === 0) return [];

  // Create defeats matrix
  const defeats: Record<string, Set<string>> = {};
  candidates.forEach(c => defeats[c] = new Set());
  
  // Record who defeats whom
  victories.forEach(v => defeats[v.winner].add(v.loser));

  // Find smallest set where each member beats all non-members
  const isValidSmithSet = (set: Set<string>): boolean => {
    const nonMembers = candidates.filter(c => !set.has(c));
    return Array.from(set).every(member => 
      nonMembers.every(nonMember => 
        defeats[member].has(nonMember) || !defeats[nonMember].has(member)
      )
    );
  };

  // Try all possible subsets, starting with smallest
  for (let size = 1; size <= candidates.length; size++) {
    // Generate all subsets of current size
    const trySubset = (current: Set<string>, start: number) => {
      if (current.size === size) {
        if (isValidSmithSet(current)) {
          return Array.from(current);
        }
        return null;
      }

      for (let i = start; i < candidates.length; i++) {
        current.add(candidates[i]);
        const result = trySubset(current, i + 1);
        if (result) return result;
        current.delete(candidates[i]);
      }
      return null;
    };

    const result = trySubset(new Set(), 0);
    if (result) return result;
  }

  return candidates; // If no smaller valid set found, return all candidates
};
