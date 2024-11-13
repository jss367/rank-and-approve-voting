import React, { useEffect } from 'react';
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

interface ChartData {
    name: string;
    approval?: number;
    score?: number;
}

interface ElectionResultsProps {
    election: Election;
}

const ElectionResults: React.FC<ElectionResultsProps> = ({ election }) => {
    useEffect(() => {
        console.log('ElectionResults mounted');
    }, []);

    console.log('ElectionResults rendered with election:', election);

    if (!election || !election.candidates || !election.votes) {
        console.log('Missing required election data:', {
            hasElection: !!election,
            hasCandidates: !!election?.candidates,
            hasVotes: !!election?.votes
        });
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

    // Calculate approval scores
    const approvalScores: ChartData[] = election.candidates.map(candidate => {
        const approvalCount = election.votes.filter(vote =>
            vote.approved.includes(candidate.id)
        ).length;
        const approvalPercentage = (approvalCount / election.votes.length) * 100;

        return {
            name: candidate.name,
            approval: Number(approvalPercentage.toFixed(1))
        };
    }).sort((a, b) => (b.approval || 0) - (a.approval || 0));

    // Calculate Borda count scores
    const bordaScores: ChartData[] = election.candidates.map(candidate => {
        const totalPoints = election.votes.reduce((sum, vote) => {
            const position = vote.ranking.indexOf(candidate.id);
            const points = election.candidates.length - position - 1;
            return sum + points;
        }, 0);
        const averagePoints = totalPoints / election.votes.length;

        return {
            name: candidate.name,
            score: Number(averagePoints.toFixed(1))
        };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));

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
                        {/* Approval Results */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Approval Results</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Rank</th>
                                            <th className="text-left py-2">Candidate</th>
                                            <th className="text-right py-2">Approval %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approvalScores.map((result, index) => (
                                            <tr key={result.name} className="border-b">
                                                <td className="py-2">{index + 1}</td>
                                                <td className="py-2">{result.name}</td>
                                                <td className="text-right py-2">{result.approval}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Ranking Results */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Ranking Results (Borda Count)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Rank</th>
                                            <th className="text-left py-2">Candidate</th>
                                            <th className="text-right py-2">Average Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bordaScores.map((result, index) => (
                                            <tr key={result.name} className="border-b">
                                                <td className="py-2">{index + 1}</td>
                                                <td className="py-2">{result.name}</td>
                                                <td className="text-right py-2">{result.score}</td>
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
