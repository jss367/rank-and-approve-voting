import { initializeApp } from 'firebase/app';
import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getFirestore,
    updateDoc
} from 'firebase/firestore';
import { Check, Copy, Grip, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD2cDOH0jIstu_e7NxPWpjf1cBb9utmxpU",
    authDomain: "rank-and-approve-voting.firebaseapp.com",
    projectId: "rank-and-approve-voting",
    storageBucket: "rank-and-approve-voting.firebasestorage.app",
    messagingSenderId: "457756698776",
    appId: "1:457756698776:web:e1326245c652affb7b08ed",
    measurementId: "G-1KCG6HW8RT"
};

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

type Mode = 'home' | 'create' | 'vote' | 'success';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
    const [mode, setMode] = useState<Mode>('home');
    const [electionId, setElectionId] = useState<string | null>(null);
    const [electionTitle, setElectionTitle] = useState('');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [newCandidate, setNewCandidate] = useState('');
    const [approvedCandidates, setApprovedCandidates] = useState<Set<string>>(new Set());
    const [voterName, setVoterName] = useState('');
    const [election, setElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setElectionId(id);
            loadElection(id);
            setMode('vote');
        }
    }, []);

    const loadElection = async (id: string) => {
        try {
            setLoading(true);
            const electionDoc = await getDoc(doc(db, 'elections', id));
            if (electionDoc.exists()) {
                const data = electionDoc.data() as Election;
                setElection(data);
                setCandidates(data.candidates);
            } else {
                setError('Election not found');
            }
        } catch (err) {
            setError('Error loading election');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createElection = async () => {
        try {
            setLoading(true);
            const electionData: Election = {
                title: electionTitle,
                candidates: candidates,
                votes: [],
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'elections'), electionData);
            const shareUrl = `${window.location.origin}${window.location.pathname}?id=${docRef.id}`;
            setShareUrl(shareUrl);
            setElectionId(docRef.id);
        } catch (err) {
            setError('Error creating election');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitVote = async () => {
        if (!voterName.trim() || !electionId) {
            setError('Please enter your name');
            return;
        }

        try {
            setLoading(true);
            const vote: Vote = {
                voterName: voterName,
                ranking: candidates.map(c => c.id),
                approved: Array.from(approvedCandidates),
                timestamp: new Date().toISOString()
            };

            const electionRef = doc(db, 'elections', electionId);
            await updateDoc(electionRef, {
                votes: arrayUnion(vote)
            });

            setMode('success');
        } catch (err) {
            setError('Error submitting vote');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addCandidate = () => {
        if (newCandidate.trim()) {
            const newCand: Candidate = {
                id: Date.now().toString(),
                name: newCandidate.trim()
            };
            setCandidates([...candidates, newCand]);
            setNewCandidate('');
        }
    };

    const removeCandidate = (id: string) => {
        setCandidates(candidates.filter(c => c.id !== id));
        const newApproved = new Set(approvedCandidates);
        newApproved.delete(id);
        setApprovedCandidates(newApproved);
    };

    const toggleApproval = (id: string) => {
        const newApproved = new Set(approvedCandidates);
        if (newApproved.has(id)) {
            newApproved.delete(id);
        } else {
            newApproved.add(id);
        }
        setApprovedCandidates(newApproved);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(candidates);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setCandidates(items);
    };

    const copyShareUrl = () => {
        navigator.clipboard.writeText(shareUrl);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Book Club Vote</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {mode === 'home' && (
                        <div className="space-y-4">
                            <Button
                                className="w-full"
                                onClick={() => setMode('create')}
                            >
                                Create New Election
                            </Button>
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="space-y-4">
                            <Input
                                value={electionTitle}
                                onChange={(e) => setElectionTitle(e.target.value)}
                                placeholder="Election Title (e.g., July Book Selection)"
                                className="mb-4"
                            />

                            <div className="flex gap-2">
                                <Input
                                    value={newCandidate}
                                    onChange={(e) => setNewCandidate(e.target.value)}
                                    placeholder="Add book title..."
                                    onKeyPress={(e) => e.key === 'Enter' && addCandidate()}
                                />
                                <Button onClick={addCandidate}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="candidates">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                            {candidates.map((candidate, index) => (
                                                <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                                                        >
                                                            <span {...provided.dragHandleProps}>
                                                                <Grip className="w-4 h-4 text-gray-400" />
                                                            </span>
                                                            <span className="flex-grow">{candidate.name}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeCandidate(candidate.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            {candidates.length > 0 && (
                                <Button
                                    className="w-full"
                                    onClick={createElection}
                                >
                                    Create Election
                                </Button>
                            )}

                            {shareUrl && (
                                <div className="mt-4 p-4 bg-gray-100 rounded">
                                    <p className="mb-2 font-bold">Share this link with voters:</p>
                                    <div className="flex gap-2">
                                        <Input value={shareUrl} readOnly />
                                        <Button onClick={copyShareUrl}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'vote' && election && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4">{election.title}</h2>

                            <Input
                                value={voterName}
                                onChange={(e) => setVoterName(e.target.value)}
                                placeholder="Your Name"
                                className="mb-4"
                            />

                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 mb-2">
                                    1. Drag to rank the books in your preferred order
                                    2. Click the checkmark to approve books you'd be happy to read
                                </p>
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="voting">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                                {candidates.map((candidate, index) => (
                                                    <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="flex items-center gap-2 p-2 bg-gray-100 rounded mb-2"
                                                            >
                                                                <span className="w-6">{index + 1}.</span>
                                                                <span className="flex-grow">{candidate.name}</span>
                                                                <Button
                                                                    variant={approvedCandidates.has(candidate.id) ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => toggleApproval(candidate.id)}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>

                            <Button
                                className="w-full"
                                onClick={submitVote}
                                disabled={!voterName.trim()}
                            >
                                Submit Vote
                            </Button>
                        </div>
                    )}

                    {mode === 'success' && (
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-2">Vote Submitted!</h2>
                            <p>Thank you for voting.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default App;
