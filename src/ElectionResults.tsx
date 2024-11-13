import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
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

    const CustomTooltip = ({
        active,
        payload,
        label,
    }: TooltipProps<ValueType, NameType>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm">
                        {payload[0].name}: {payload[0].value}
                        {payload[0].name === "Approval" ? "%" : " points"}
                    </p>
                </div>
            );
        }
        return null;
    };

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
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="approval" fill="#22C55E" name="Approval" />
                                    </BarChart>
                                </ResponsiveContainer>
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
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="score" fill="#3B82F6" name="Score" />
                                    </BarChart>
                                </ResponsiveContainer>
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
