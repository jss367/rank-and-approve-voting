import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';

interface Candidate {
    id: string;
    name: string;
}

interface Vote {
    voterName: string;
    ranking: string[];
    approved: string[];
    timestamp: string;
}

interface Election {
    title: string;
    candidates: Candidate[];
    votes: Vote[];
    createdAt: string;
}

interface HeadToHeadResult {
    winner: string;
    loser: string;
    winnerVotes: number;
    loserVotes: number;
}

interface CandidateScore {
    name: string;
    approval: number;
    wins: number;
    losses: number;
}

const ElectionResults: React.FC<{ election: Election }> = ({ election }) => {
    console.log('ElectionResults rendered with election:', election);

    if (!election || !election.candidates || !election.votes) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No election data available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Please check the URL and try again.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Calculate head-to-head matchups
    const getHeadToHeadResults = () => {
        const results: HeadToHeadResult[] = [];

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
                    // Ties are ignored
                });

                if (candidate1Wins > candidate2Wins) {
                    results.push({
                        winner: candidate1.name,
                        loser: candidate2.name,
                        winnerVotes: candidate1Wins,
                        loserVotes: candidate2Wins
                    });
                } else if (candidate2Wins > candidate1Wins) {
                    results.push({
                        winner: candidate2.name,
                        loser: candidate1.name,
                        winnerVotes: candidate2Wins,
                        loserVotes: candidate1Wins
                    });
                }
                // Ties are excluded from results
            }
        }

        return results;
    };

    // Calculate Smith set
    const calculateSmithSet = (headToHeadResults: HeadToHeadResult[]): string[] => {
        const candidates = new Set(election.candidates.map(c => c.name));
        const defeats: Record<string, string[]> = {};

        // Initialize defeats object
        candidates.forEach(candidate => {
            defeats[candidate] = [];
        });

        // Record who defeats whom
        headToHeadResults.forEach(result => {
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

    // Calculate approval scores
    const getApprovalScores = () => {
        return election.candidates.map(candidate => ({
            name: candidate.name,
            approval: election.votes.filter(vote =>
                vote.approved.includes(candidate.id)
            ).length
        })).sort((a, b) => b.approval - a.approval);
    };

    const headToHeadResults = getHeadToHeadResults();
    const smithSet = calculateSmithSet(headToHeadResults);
    const approvalScores = getApprovalScores();

    // Find winner - highest approval among Smith set
    const winner = approvalScores
        .filter(candidate => smithSet.includes(candidate.name))
        .sort((a, b) => b.approval - a.approval)[0];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Election Results: {election.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Total Votes: {election.votes.length}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* Winner */}
                        {winner && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-green-800">Winner: {winner.name}</h3>
                                <p className="text-sm text-green-600">
                                    Selected from Smith set with highest approval ({winner.approval} votes)
                                </p>
                            </div>
                        )}

                        {/* Smith Set */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Smith Set</h3>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-600">
                                    Candidates that are not beaten by anyone outside the set:
                                </p>
                                <ul className="mt-2 space-y-1">
                                    {smithSet.map(candidate => (
                                        <li key={candidate} className="text-blue-800">
                                            {candidate}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Head-to-head Results */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Head-to-head Matchups</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Winner</th>
                                            <th className="text-left py-2">Loser</th>
                                            <th className="text-right py-2">Margin</th>
                                            <th className="text-right py-2">Vote Split</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {headToHeadResults.map((result, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="py-2">{result.winner}</td>
                                                <td className="py-2">{result.loser}</td>
                                                <td className="text-right py-2">
                                                    {result.winnerVotes - result.loserVotes}
                                                </td>
                                                <td className="text-right py-2">
                                                    {result.winnerVotes} - {result.loserVotes}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Approval Scores */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Approval Scores</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Candidate</th>
                                            <th className="text-right py-2">Approvals</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approvalScores.map((score, index) => (
                                            <tr key={score.name} className="border-b">
                                                <td className="py-2">{score.name}</td>
                                                <td className="text-right py-2">{score.approval}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ElectionResults;
