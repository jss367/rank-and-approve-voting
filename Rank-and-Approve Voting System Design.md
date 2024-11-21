# Ranked and Approval Voting System Design

## Overview
This system combines ranked-choice voting with approval voting to create a hybrid voting method that considers both voter preferences and candidate acceptability.

## Input
Each vote consists of:
1. A complete ranking of candidates (from most to least preferred)
2. A set of approved candidates (those the voter finds acceptable)

## Method of Determining Winners

### Step 1: Calculate Pairwise Results
For each pair of candidates A and B:
- Count how many voters ranked A above B
- Count how many voters ranked B above A
- If a voter ranked neither candidate, their vote is not counted for this pair
- Create a complete matrix of head-to-head matchups

### Step 2: Determine Head-to-Head Victories
For each pair of candidates:
- If candidate A received more votes than candidate B in their head-to-head matchup, record this as a victory for A over B
- Record the margin of victory (difference in votes)
- Ties are not recorded as victories

### Step 3: Calculate Smith Set
The Smith set contains candidates who are collectively unbeatable. To calculate:
1. Start with all candidates
2. A candidate is in the Smith set if either:
   - They can reach all other candidates through a chain of victories, OR
   - For any candidate they can't reach, they don't have a losing record against them

Key points:
- If candidate A beats B and B beats C, then A can "reach" C
- A tie is not considered a victory or a loss
- If there are only ties, all candidates should be in the Smith set

### Step 4: Final Ranking
Among candidates in the Smith set, rank them by:
1. Number of approval votes (highest to lowest)
2. If tied on approval votes, check direct head-to-head matchup
3. If no direct winner or tied, compare net head-to-head record (wins minus losses)
4. If still tied, use average victory margin
5. If still tied, candidates share the rank

## Edge Cases and Expected Behavior

### Perfect Ties
When two candidates have:
- Equal approval votes
- Tied head-to-head matchup
- Equal win-loss records against others

Expected behavior:
- Both candidates should be in the Smith set
- They should receive the same rank
- Their relative order should be maintained but marked as tied

### Mixed Victory/Tie Scenarios
When candidates have a mix of wins, losses, and ties:
- A candidate who has both wins and ties (but no losses) should be in the Smith set
- A candidate with any losses should only be in the Smith set if they can reach all other candidates through victories
- Example scenario:
  * Candidate 1: Beats 2, Ties with 3
  * Candidate 2: Beats 3
  * Candidate 3: Ties with 1
  * Expected Result: Only Candidate 1 in Smith set because:
    - Has victory over 2 and non-losing record against 3
    - Candidate 2 is excluded (loses to 1)
    - Candidate 3 is excluded (loses to 2)

### Cyclic Preferences (Rock-Paper-Scissors)
When:
- A beats B
- B beats C
- C beats A

Expected behavior:
- All candidates should be in the Smith set
- Final ranking should be determined by approval votes
- If approval votes are equal, they should be marked as tied

### Partial Rankings
When a voter doesn't rank all candidates:
- Unranked candidates are considered lower preference than ranked ones
- For head-to-head matchups between unranked candidates, the vote is not counted

### Approval Vote Only
When all rankings are tied but approval votes differ:
- All candidates should be in the Smith set
- Final ranking should be determined solely by approval votes

### No Approval Votes
When a candidate receives no approval votes:
- They can still be in the Smith set based on rankings
- They will be ranked below candidates with approval votes

### Single Vote
When there's only one vote:
- The Smith set should include only the top-ranked candidate
- Approval votes should still affect final ranking

### Empty Election
When there are no votes:
- All candidates should be in the Smith set
- All candidates should be tied for first place

## Implementation Notes
- The Smith set calculation should be resilient to ties and cycles
- Ties should be explicitly marked in the output
- The system should handle any number of candidates and votes
- All edge cases should have corresponding test cases