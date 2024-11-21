import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { getPairwiseResults, getHeadToHeadVictories, calculateSmithSet, selectWinner } from './utils/ElectionUtils';
import { Election } from './types';
import type { CandidateScore } from './utils/ElectionUtils';

const ElectionResults: React.FC<{ election: Election }> = ({ election }) => {
    if (!election || !election.candidates || !election.votes) {
        return (
            <Card className="max-w-5xl mx-auto">
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

    if (election.votes.length === 0) {
        return (
            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl">Election Results: {election.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No votes have been cast yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const pairwiseResults = getPairwiseResults(election);
    const victories = getHeadToHeadVictories(pairwiseResults);
    const smithSet = calculateSmithSet(victories);
    
    // Get scores for all candidates in the Smith set
    const rankedCandidates = smithSet.length > 0 
        ? (selectWinner(smithSet, victories, election, true) as CandidateScore[])
        : [];

    return (
        <div className="space-y-8">
            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl">Election Results: {election.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Total Votes: {election.votes.length}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* Smith Set Rankings */}
                        {rankedCandidates.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Smith Set Rankings</h3>
                                <div className="space-y-4">
                                    {rankedCandidates.map((candidate: CandidateScore, index: number) => (
                                        <div 
                                            key={candidate.name}
                                            className={`p-6 rounded-lg border ${
                                                index === 0 
                                                    ? "bg-green-50 border-green-200" 
                                                    : "bg-slate-50 border-slate-200"
                                            }`}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-lg font-semibold ${
                                                        index === 0 ? "text-green-800" : "text-slate-800"
                                                    }`}>
                                                        {index + 1}. {candidate.name}
                                                    </h4>
                                                    <span className={`text-sm font-medium ${
                                                        index === 0 ? "text-green-800" : "text-slate-600"
                                                    }`}>
                                                        Score: {candidate.totalScore.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className={`text-sm space-y-1 font-mono ${
                                                    index === 0 ? "text-green-700" : "text-slate-600"
                                                }`}>
                                                    <div>• Head-to-Head Record: {candidate.netVictories > 0 ? "+" : ""}{candidate.netVictories} ({candidate.wins} wins, {candidate.losses} losses)</div>
                                                    <div>• Average Victory Margin: {candidate.avgMargin.toFixed(2)}</div>
                                                    <div>• Approval Votes: {candidate.approvalScore}</div>
                                                    <div className="mt-2 font-sans">
                                                        Score Breakdown:
                                                        <ul className="ml-4">
                                                            <li>• Victories: {(candidate.netVictories * 0.4).toFixed(2)} (40% weight)</li>
                                                            <li>• Margins: {(candidate.avgMargin * 0.3).toFixed(2)} (30% weight)</li>
                                                            <li>• Approval: {(candidate.approvalScore * 0.3).toFixed(2)} (30% weight)</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rest of the component remains the same */}
                        {/* Smith Set Explanation */}
                        {smithSet.length > 0 && (
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-600 mb-4">
                                    The Smith set contains candidates who can defeat or tie with any candidate outside the set.
                                    The winner is selected using a weighted scoring system that considers:
                                </p>
                                <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                                    <li>Head-to-head victories (40% of total score)</li>
                                    <li>Average margin of victory (30% of total score)</li>
                                    <li>Approval votes (30% of total score)</li>
                                </ul>
                            </div>
                        )}

                        {/* Head-to-head Results */}
                        {pairwiseResults.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Head-to-head Matchups</h3>
                                <div className="grid gap-4">
                                    {pairwiseResults.map((result, index) => (
                                        <div key={index} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                            <div className="grid grid-cols-[minmax(0,2.5fr),auto,minmax(0,2.5fr)] gap-8 items-center">
                                                <div className="space-y-2 min-w-0">
                                                    <p className="font-medium line-clamp-2 min-h-[2.5rem] text-lg">
                                                        {result.candidate1}
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        {result.candidate1Votes} votes
                                                    </p>
                                                </div>
                                                <div className="text-slate-400 font-medium self-start pt-2 px-4">
                                                    vs
                                                </div>
                                                <div className="space-y-2 min-w-0 text-right">
                                                    <p className="font-medium line-clamp-2 min-h-[2.5rem] text-lg">
                                                        {result.candidate2}
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        {result.candidate2Votes} votes
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-sm text-center font-medium text-slate-700 pt-3 border-t border-slate-200">
                                                Winner: {
                                                    result.candidate1Votes > result.candidate2Votes
                                                        ? result.candidate1
                                                        : result.candidate2Votes > result.candidate1Votes
                                                            ? result.candidate2
                                                            : "Tie"
                                                }
                                                {result.candidate1Votes !== result.candidate2Votes && 
                                                    ` (by ${Math.abs(result.candidate1Votes - result.candidate2Votes)} votes)`
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ElectionResults;