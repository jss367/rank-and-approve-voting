import { Election, PairwiseResult } from '../types';

interface Victory {
    winner: string;
    loser: string;
    margin: number;
}

interface CandidateScore {
    name: string;
    netVictories: number;
    avgMargin: number;
    approvalScore: number;
    totalScore: number;
    description: string;
}

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

export const getHeadToHeadVictories = (pairwiseResults: PairwiseResult[]): Victory[] => {
    const victories: Victory[] = [];

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
        // Note: We no longer add both directions for ties
    });

    return victories.sort((a, b) => a.winner.localeCompare(b.winner));
};

export const calculateSmithSet = (victories: Victory[]): string[] => {
    // Get all candidates
    const candidates = Array.from(new Set(victories.flatMap(v => [v.winner, v.loser])));

    // Create defeat graph (only including strict victories)
    const defeats = new Map<string, Set<string>>();
    candidates.forEach(c => defeats.set(c, new Set()));

    // Fill in victories
    victories.forEach(v => {
        defeats.get(v.winner)?.add(v.loser);
    });

    // Helper function: can candidate A reach candidate B through victories?
    const canReach = (start: string, target: string, visited = new Set<string>()): boolean => {
        if (start === target) return true;
        if (visited.has(start)) return false;

        visited.add(start);
        const beatenCandidates = defeats.get(start) || new Set();
        return Array.from(beatenCandidates).some(c => canReach(c, target, visited));
    };

    // A candidate is in the Smith set if they can reach all others OR
    // have a winning or tied record against everyone not in their reach
    const isInSmithSet = (candidate: string): boolean => {
        const reachableCandidates = new Set(
            candidates.filter(other => 
                candidate === other || canReach(candidate, other)
            )
        );

        const unreachableCandidates = candidates.filter(c => !reachableCandidates.has(c));
        
        // Check if candidate has non-losing record against unreachable candidates
        const hasNonLosingRecord = unreachableCandidates.every(other => {
            const losesToOther = victories.some(v => 
                v.winner === other && v.loser === candidate
            );
            return !losesToOther;
        });

        return reachableCandidates.size === candidates.length || hasNonLosingRecord;
    };

    // Calculate Smith set
    return candidates.filter(isInSmithSet).sort();
};

export const selectWinner = (
    smithSet: string[], 
    victories: Victory[], 
    election: Election
): CandidateScore => {
    const scores: CandidateScore[] = smithSet.map(candidate => {
        // Calculate net victories
        const wins = victories.filter(v => v.winner === candidate).length;
        const losses = victories.filter(v => v.loser === candidate).length;
        const netVictories = wins - losses;
        
        // Calculate average margin
        const margins = victories
            .filter(v => v.winner === candidate || v.loser === candidate)
            .map(v => v.winner === candidate ? v.margin : -v.margin);
        const avgMargin = margins.length > 0 
            ? margins.reduce((sum, m) => sum + m, 0) / margins.length
            : 0;
        
        // Calculate approval score
        const candidateId = election.candidates.find(c => c.name === candidate)?.id || '';
        const approvalScore = election.votes.filter(vote => 
            vote.approved.includes(candidateId)
        ).length;

        // Calculate weighted total (adjust weights as needed)
        const totalScore = (netVictories * 0.4) + (avgMargin * 0.3) + (approvalScore * 0.3);
        
        // Create description of the scoring
        const description = [
            `Net Head-to-Head Victories: ${netVictories} (${wins} wins, ${losses} losses)`,
            `Average Victory Margin: ${avgMargin.toFixed(2)}`,
            `Approval Votes: ${approvalScore}`,
            `Total Score: ${totalScore.toFixed(2)} (weighted combination)`
        ].join('\n');

        return {
            name: candidate,
            netVictories,
            avgMargin,
            approvalScore,
            totalScore,
            description
        };
    });
    
    // Sort by total score and return the winner
    return scores.sort((a, b) => b.totalScore - a.totalScore)[0];
};