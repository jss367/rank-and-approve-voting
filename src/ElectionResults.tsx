import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { getPairwiseResults, getHeadToHeadVictories, calculateSmithSet } from './utils/ElectionUtils';
import { Election } from './types';

const ElectionResults: React.FC<{ election: Election }> = ({ election }) => {
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

    const pairwiseResults = getPairwiseResults(election);
    const victories = getHeadToHeadVictories(pairwiseResults);
    const smithSet = calculateSmithSet(victories);

    const approvalScores = election.candidates.map(candidate => ({
        name: candidate.name,
        approval: election.votes.filter(vote =>
            vote.approved.includes(candidate.id)
        ).length
    })).sort((a, b) => b.approval - a.approval);

    const winner = approvalScores
        .filter(candidate => smithSet.includes(candidate.name))
        .sort((a, b) => b.approval - a.approval)[0];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Election Results: {election.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Total Votes: {election.votes.length}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* Pairwise Results */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Head-to-head Matchups</h3>
                            <div className="grid gap-4">
                                {pairwiseResults.map((result, index) => (
                                    <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                                            <div className="space-y-1 min-w-0">
                                                <p className="font-medium truncate" title={result.candidate1}>
                                                    {result.candidate1}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {result.candidate1Votes} votes
                                                </p>
                                            </div>
                                            <div className="text-slate-400 text-sm font-medium">
                                                vs
                                            </div>
                                            <div className="space-y-1 min-w-0 text-right">
                                                <p className="font-medium truncate" title={result.candidate2}>
                                                    {result.candidate2}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {result.candidate2Votes} votes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm text-center font-medium text-slate-700">
                                            Winner: {
                                                result.candidate1Votes > result.candidate2Votes
                                                    ? result.candidate1
                                                    : result.candidate2Votes > result.candidate1Votes
                                                        ? result.candidate2
                                                        : "Tie"
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smith Set */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Smith Set</h3>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-600 mb-2">
                                    The Smith set contains the candidates that form the smallest non-empty set where every candidate in the set beats every candidate outside the set in a head-to-head match.
                                </p>
                                <div className="text-sm font-medium text-blue-800 break-words">
                                    Smith Set members: {smithSet.join(", ")}
                                </div>
                            </div>
                        </div>

                        {/* Winner */}
                        {winner && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-green-800 break-words">
                                    Winner: {winner.name}
                                </h3>
                                <p className="text-sm text-green-600">
                                    Selected from the Smith set with highest approval ({winner.approval} votes)
                                </p>
                            </div>
                        )}

                        {/* Approval Scores */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Approval Scores</h3>
                            <div className="grid gap-2">
                                {approvalScores.map((score) => (
                                    <div
                                        key={score.name}
                                        className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-200"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate" title={score.name}>
                                                {score.name}
                                            </p>
                                        </div>
                                        <span className="ml-4 text-slate-600 whitespace-nowrap">
                                            {score.approval} approvals
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ElectionResults;