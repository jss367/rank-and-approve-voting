import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import {
    getPairwiseResults,
    getHeadToHeadVictories,
    calculateSmithSet,
    selectWinner,
    getOrdinalSuffix
} from './utils/ElectionUtils';
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
                                    {rankedCandidates.map((candidate: CandidateScore, index: number) => {
                                        const isFirstPlace = candidate.rank === 1;
                                        const hasTie = candidate.isTied;
                                        
                                        return (
                                            <div 
                                                key={candidate.name}
                                                className={`p-6 rounded-lg border ${
                                                    isFirstPlace
                                                        ? hasTie 
                                                            ? "bg-yellow-50 border-yellow-200"  // Tied for first
                                                            : "bg-green-50 border-green-200"    // Clear winner
                                                        : "bg-slate-50 border-slate-200"        // Other positions
                                                }`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className={`text-lg font-semibold ${
                                                                isFirstPlace 
                                                                    ? hasTie
                                                                        ? "text-yellow-800"
                                                                        : "text-green-800"
                                                                    : "text-slate-800"
                                                            }`}>
                                                                {candidate.name}
                                                            </h4>
                                                            <p className={`text-sm ${
                                                                isFirstPlace
                                                                    ? hasTie
                                                                        ? "text-yellow-700"
                                                                        : "text-green-700"
                                                                    : "text-slate-600"
                                                            }`}>
                                                                {hasTie ? `Tied for ${candidate.rank}${getOrdinalSuffix(candidate.rank)} place` : `${candidate.rank}${getOrdinalSuffix(candidate.rank)} place`}
                                                            </p>
                                                        </div>
                                                        <div className={`text-sm font-medium space-y-1 text-right ${
                                                            isFirstPlace
                                                                ? hasTie
                                                                    ? "text-yellow-800"
                                                                    : "text-green-800"
                                                                : "text-slate-600"
                                                        }`}>
                                                            <div>Approval Votes: {candidate.metrics.approval}</div>
                                                            <div>Net H2H: {candidate.metrics.headToHead > 0 ? "+" : ""}{candidate.metrics.headToHead}</div>
                                                            <div>Avg Margin: {candidate.metrics.margin.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                    {candidate.description && (
                                                        <div className={`text-sm space-y-1 font-mono ${
                                                            isFirstPlace
                                                                ? hasTie
                                                                    ? "text-yellow-700"
                                                                    : "text-green-700"
                                                                : "text-slate-600"
                                                        }`}>
                                                            {candidate.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Smith Set Explanation */}
                        {smithSet.length > 0 && (
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-600 mb-4">
                                    Rankings are determined in order by:
                                </p>
                                <ol className="text-sm text-blue-700 list-decimal pl-5 space-y-1">
                                    <li>Number of approval votes</li>
                                    <li>If tied, head-to-head record (net wins minus losses)</li>
                                    <li>If still tied and they faced each other, direct matchup result</li>
                                    <li>If still tied, average victory margin</li>
                                </ol>
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