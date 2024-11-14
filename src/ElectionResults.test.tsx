import { Election } from './types';
import { calculateSmithSet, getHeadToHeadVictories, getPairwiseResults } from './utils/ElectionUtils';

describe('Election Result Calculations', () => {
    const threeWayTestElection: Election = {
        title: "Test Election",
        candidates: [
            { id: "1", name: "Candidate 1" },
            { id: "2", name: "Candidate 2" },
            { id: "3", name: "Candidate 3" }
        ],
        votes: [
            // Candidate 1 > 2 > 3
            {
                voterName: "Voter 1",
                ranking: ["1", "2", "3"],
                approved: ["1"],
                timestamp: new Date().toISOString()
            },
            {
                voterName: "Voter 2",
                ranking: ["1", "2", "3"],
                approved: ["1"],
                timestamp: new Date().toISOString()
            },
            // Candidate 2 > 3 > 1
            {
                voterName: "Voter 3",
                ranking: ["2", "3", "1"],
                approved: ["2"],
                timestamp: new Date().toISOString()
            },
            // Candidate 3 > 1 > 2
            {
                voterName: "Voter 4",
                ranking: ["3", "1", "2"],
                approved: ["3"],
                timestamp: new Date().toISOString()
            }
        ],
        createdAt: new Date().toISOString()
    };

    test.skip('generates correct pairwise results for three candidates', () => {
        const results = getPairwiseResults(threeWayTestElection);

        expect(results).toEqual([
            {
                candidate1: "Candidate 1",
                candidate2: "Candidate 2",
                candidate1Votes: 2,
                candidate2Votes: 1
            },
            {
                candidate1: "Candidate 1",
                candidate2: "Candidate 3",
                candidate1Votes: 2,
                candidate2Votes: 2
            },
            {
                candidate1: "Candidate 2",
                candidate2: "Candidate 3",
                candidate1Votes: 2,
                candidate2Votes: 2
            }
        ]);
    });

    test.skip('calculates head-to-head victories correctly', () => {
        const pairwise = getPairwiseResults(threeWayTestElection);
        const victories = getHeadToHeadVictories(pairwise);

        expect(victories).toEqual([
            {
                winner: "Candidate 1",
                loser: "Candidate 2",
                margin: 1
            }
        ]);
    });

    test.skip('identifies correct Smith set', () => {
        const pairwise = getPairwiseResults(threeWayTestElection);
        const victories = getHeadToHeadVictories(pairwise);
        const smithSet = calculateSmithSet(victories);

        // Due to the voting pattern, all candidates should be in the Smith set
        // because no candidate completely dominates the others
        expect(new Set(smithSet)).toEqual(new Set([
            "Candidate 1",
            "Candidate 2",
            "Candidate 3"
        ]));
    });
});
