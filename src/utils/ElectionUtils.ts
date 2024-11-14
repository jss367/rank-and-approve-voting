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
  // Get all candidates (now we're guaranteed to have them all because ties are included)
  const candidates = Array.from(new Set(victories.flatMap(v => [v.winner, v.loser])));

  // Only consider non-tie victories for dominance
  const realVictories = victories.filter(v => v.margin > 0);

  // If no real victories (only ties), everyone is in the Smith set
  if (realVictories.length === 0) {
    return candidates.sort();
  }

  // Get all unique candidates
  const candidates = Array.from(new Set(victories.flatMap(v => [v.winner, v.loser])));

  // Create defeat graph
  const defeats = new Map<string, Set<string>>();
  candidates.forEach(c => defeats.set(c, new Set()));
  victories.forEach(v => defeats.get(v.winner)?.add(v.loser));

  // Find strongly connected components (SCCs)
  const visited = new Set<string>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const sccs: Set<string>[] = [];
  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();

  function tarjan(v: string) {
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    // Consider successors
    const successors = defeats.get(v) || new Set();
    for (const w of successors) {
      if (!indices.has(w)) {
        // Successor w has not yet been visited; recurse on it
        tarjan(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        // Successor w is in stack and hence in the current SCC
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    // If v is a root node, pop the stack and generate an SCC
    if (lowlink.get(v) === indices.get(v)) {
      const scc = new Set<string>();
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.add(w);
      } while (w !== v);
      if (scc.size > 0) {
        sccs.push(scc);
      }
    }
  }

  // Run Tarjan's algorithm to find SCCs
  candidates.forEach(v => {
    if (!indices.has(v)) {
      tarjan(v);
    }
  });

  // Identify SCCs with no incoming edges from outside the SCC
  const smithSetCandidates = new Set<string>();

  for (const scc of sccs) {
    let hasIncomingEdges = false;

    // Check if any candidate in this SCC is defeated by a candidate outside the SCC
    for (const candidate of scc) {
      for (const otherCandidate of candidates) {
        if (!scc.has(otherCandidate) && defeats.get(otherCandidate)?.has(candidate)) {
          hasIncomingEdges = true;
          break;
        }
      }
      if (hasIncomingEdges) break;
    }

    // If no incoming edges from outside, add this SCC to the Smith Set
    if (!hasIncomingEdges) {
      for (const candidate of scc) {
        smithSetCandidates.add(candidate);
      }
    }
  }

  // Return the Smith Set as a sorted array
  return Array.from(smithSetCandidates).sort();
};
