import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';

// Import recharts components separately to avoid type issues
const {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip
} = require('recharts');

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

    useEffect(() => {
        console.log('Election data changed:', election);
    }, [election]);

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

    console.log('Calculated approval scores:', approvalScores);

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
                            <div className="h-64">
                                {approvalScores.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={approvalScores}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis
                                                label={{
                                                    value: 'Approval %',
                                                    angle: -90,
                                                    position: 'insideLeft'
                                                }}
                                            />
                                            <Tooltip />
                                            <Bar
                                                dataKey="approval"
                                                fill="#22C55E"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="space-y-2">
                                {approvalScores.map((result, index) => (
                                    <div key={result.name} className="flex justify-between items-center">
                                        <span className="font-medium">
                                            {index + 1}. {result.name}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {result.approval}% approval
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ranking Results */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Ranking Results (Borda Count)</h3>
                            <div className="h-64">
                                {bordaScores.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={bordaScores}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis
                                                label={{
                                                    value: 'Average Points',
                                                    angle: -90,
                                                    position: 'insideLeft'
                                                }}
                                            />
                                            <Tooltip />
                                            <Bar
                                                dataKey="score"
                                                fill="#3B82F6"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="space-y-2">
                                {bordaScores.map((result, index) => (
                                    <div key={result.name} className="flex justify-between items-center">
                                        <span className="font-medium">
                                            {index + 1}. {result.name}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {result.score} avg. points
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
