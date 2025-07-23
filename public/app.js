const { useState, useEffect, useRef } = React;

// Import the InteractiveLogo component
// InteractiveLogo.js must be loaded before this script

// Particle system for background effect
const ParticleSystem = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 10000));
            
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        initParticles();

        // Mouse move handler
        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw particles
            particlesRef.current.forEach((particle, index) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Mouse interaction
                const dx = mouseRef.current.x - particle.x;
                const dy = mouseRef.current.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    particle.vx += dx * force * 0.001;
                    particle.vy += dy * force * 0.001;
                }
                
                // Boundary check
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                
                // Keep particles in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
                ctx.fill();
                
                // Draw connections
                particlesRef.current.slice(index + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
                        ctx.stroke();
                    }
                });
            });
            
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return <canvas ref={canvasRef} id="particles-canvas" />;
};

// Login Screen Component
const LoginScreen = ({ onLogin, isLoading }) => {
    return (
        <div className="min-h-screen flex flex-col relative bg-black">
            {/* Logo positioned in upper portion */}
            <div className="flex-1 flex items-center justify-center">
                <InteractiveLogo />
            </div>
            {/* Login button positioned in lower portion */}
            <div className="content text-center z-10 pb-20">
                <button
                    onClick={onLogin}
                    disabled={isLoading}
                    className="bg-white text-gray-800 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3 mx-auto disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Signing in...' : 'Login with Google'}
                </button>
            </div>
        </div>
    );
};

// Game Step Component
const GameStep = ({ step, onAnswer, currentScore, totalSteps }) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [showResult, setShowResult] = useState(false);

    // Reset state when step changes
    useEffect(() => {
        setSelectedOption('');
        setShowResult(false);
    }, [step.stepId]);

    const handleSubmit = () => {
        if (!selectedOption) {
            console.log('No option selected, cannot submit');
            return;
        }
        
        console.log('Submitting answer:', selectedOption);
        setShowResult(true);
        setTimeout(() => {
            onAnswer({
                stepId: step.stepId,
                question: step.question,
                answer: selectedOption,
                category: step.category,
                points: step.points
            });
        }, 1500);
    };

    const handleOptionClick = (option) => {
        console.log('Option clicked:', option);
        setSelectedOption(option);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-blue-400 font-medium">Step {step.stepId} of {totalSteps}</span>
                    <span className="text-green-400 font-medium">Score: {currentScore}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step.stepId / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-6">{step.question}</h3>
                
                <div className="space-y-3">
                    {step.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                                selectedOption === option
                                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                            }`}
                            disabled={showResult}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {showResult && (
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-lg px-4 py-2">
                            <span className="text-green-400">✓</span>
                            <span className="text-green-300">+{step.points} points earned!</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!selectedOption || showResult}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
                >
                    {showResult ? 'Moving to next step...' : 'Continue'}
                </button>
                
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                    Debug: Selected="{selectedOption}", ShowResult={showResult.toString()}, ButtonEnabled={(!selectedOption || showResult) ? 'false' : 'true'}
                </div>
            </div>
        </div>
    );
};

// Project Idea Display Component
const ProjectIdeaDisplay = ({ idea, onStartNew }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-white">Your Personalized Project Idea</h3>
                    <div className="flex gap-3">
                        <div className="bg-green-600/20 border border-green-600 text-green-400 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                            <span>✓</span>
                            <span>Automatically Saved</span>
                        </div>
                        <button
                            onClick={onStartNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Generate New Idea
                        </button>
                    </div>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                    {idea}
                </div>
            </div>
        </div>
    );
};

// History Component
const HistoryView = ({ user, onBack, onViewIdea }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (typeof firebase === 'undefined') {
                setIsLoading(false);
                return;
            }
            
            try {
                const functions = firebase.functions();
                const getUserHistory = functions.httpsCallable('getUserHistory');
                const result = await getUserHistory({ userId: user.uid });
                
                if (result.data.success) {
                    setHistory(result.data.history);
                }
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto text-center">
                <div className="text-white">Loading your project history...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Project History</h2>
                <button
                    onClick={onBack}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Back to Generator
                </button>
            </div>

            {history.length === 0 ? (
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-400">No project ideas generated yet. Start your first gamified session!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div 
                            key={item.id} 
                            className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() => onViewIdea(item.idea)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-white">{item.query}</h3>
                                <span className="text-green-400 font-medium">Score: {item.gameScore}</span>
                            </div>
                            <div className="text-sm text-gray-400 mb-2">
                                {item.studentProfile.stream} • {item.studentProfile.year} • {item.studentProfile.skillLevel}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                                Generated on {new Date(item.generatedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-blue-400">
                                Click to view full idea →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Main App Screen Component
const AppScreen = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState('welcome');
    const [query, setQuery] = useState('');
    const [gameSteps, setGameSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [gameResponses, setGameResponses] = useState([]);
    const [currentScore, setCurrentScore] = useState(0);
    const [studentProfile, setStudentProfile] = useState({});
    const [generatedIdea, setGeneratedIdea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [userHistory, setUserHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const functions = typeof firebase !== 'undefined' ? firebase.functions() : null;
    const firestore = typeof firebase !== 'undefined' ? firebase.firestore() : null;

    // Load user history function
    const loadUserHistory = async () => {
        if (!functions) return;
        
        setIsLoadingHistory(true);
        try {
            const getUserHistory = functions.httpsCallable('getUserHistory');
            const result = await getUserHistory({ userId: user.uid });
            
            if (result.data.success) {
                setUserHistory(result.data.history);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load history on component mount
    useEffect(() => {
        loadUserHistory();
    }, [user]);

    const startGameFlow = async () => {
        if (!functions) {
            alert('Firebase functions not available. Please run from Firebase hosting.');
            return;
        }

        try {
            const getGameSteps = functions.httpsCallable('getGameSteps');
            const result = await getGameSteps({});
            
            if (result.data.success) {
                setGameSteps(result.data.steps);
                setCurrentView('game');
                setCurrentStepIndex(0);
                setGameResponses([]);
                setCurrentScore(0);
                setStudentProfile({});
            }
        } catch (error) {
            console.error('Error starting game flow:', error);
            alert('Error starting the gamified flow. Please try again.');
        }
    };

    const handleGameAnswer = (answer) => {
        const newResponses = [...gameResponses, answer];
        setGameResponses(newResponses);
        setCurrentScore(currentScore + answer.points);
        
        // Build student profile
        const newProfile = { ...studentProfile };
        if (answer.category === 'stream') newProfile.stream = answer.answer;
        else if (answer.category === 'year') newProfile.year = answer.answer;
        else if (answer.category === 'skillLevel') newProfile.skillLevel = answer.answer;
        else if (answer.category === 'teamSize') newProfile.teamSize = answer.answer;
        else if (answer.category === 'projectDuration') newProfile.projectDuration = answer.answer;
        else if (answer.category === 'interests') {
            newProfile.interests = newProfile.interests ? [...newProfile.interests, answer.answer] : [answer.answer];
        }
        else if (answer.category === 'preferredTechnologies') {
            newProfile.preferredTechnologies = newProfile.preferredTechnologies ? [...newProfile.preferredTechnologies, answer.answer] : [answer.answer];
        }
        
        setStudentProfile(newProfile);

        if (currentStepIndex < gameSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            // Game completed, now generate idea
            generatePersonalizedIdea(newProfile, newResponses);
        }
    };

    const generatePersonalizedIdea = async (profile, responses) => {
        if (!query.trim()) {
            alert('Please enter your project idea query first.');
            setCurrentView('welcome');
            return;
        }

        setCurrentView('generating');
        setIsGenerating(true);

        try {
            const generateIdea = functions.httpsCallable('generateIdea');
            const result = await generateIdea({ 
                query: query,
                studentProfile: profile,
                gameResponses: responses
            });
            
            if (result.data.success) {
                setGeneratedIdea(result.data.idea);
                setCurrentView('result');
                
                // Automatically save to history
                try {
                    console.log('Attempting to auto-save idea to history for user:', user.uid);
                    console.log('Idea data to save:', {
                        query: query,
                        ideaLength: result.data.idea ? result.data.idea.length : 0,
                        profileSummary: profile,
                        gameScore: currentScore,
                        gameStepsCount: responses.length
                    });
                    
                    const saveIdeaToHistory = functions.httpsCallable('saveIdeaToHistory');
                    const saveResult = await saveIdeaToHistory({
                        userId: user.uid,
                        ideaData: {
                            query,
                            idea: result.data.idea,
                            studentProfile: profile,
                            gameScore: currentScore
                        },
                        gameSteps: responses
                    });
                    
                    console.log('Idea automatically saved to history with result:', saveResult.data);
                    
                    // Refresh history after saving
                    console.log('Refreshing history data...');
                    await loadUserHistory();
                    console.log('History refreshed, current count:', userHistory.length);
                } catch (historyError) {
                    console.error('Error auto-saving to history:', historyError);
                    // Don't show error to user as this is automatic
                }
                
                // Save to user profile
                if (firestore) {
                    await firestore.collection('users').doc(user.uid).set({
                        lastQuery: query,
                        lastProfile: profile,
                        lastScore: currentScore,
                        name: user.displayName,
                        email: user.email,
                    }, { merge: true });
                }
            }
        } catch (error) {
            console.error('Error generating personalized idea:', error);
            alert('Error generating your personalized idea. Please try again.');
            setCurrentView('welcome');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveToHistory = async () => {
        if (!functions) return;
        
        try {
            const saveIdeaToHistory = functions.httpsCallable('saveIdeaToHistory');
            await saveIdeaToHistory({
                userId: user.uid,
                ideaData: {
                    query,
                    idea: generatedIdea,
                    studentProfile,
                    gameScore: currentScore
                },
                gameSteps: gameResponses
            });
            alert('Project idea saved to your history!');
        } catch (error) {
            console.error('Error saving to history:', error);
            alert('Error saving to history. Please try again.');
        }
    };

    const startNewIdea = () => {
        setCurrentView('welcome');
        setQuery('');
        setGameResponses([]);
        setCurrentScore(0);
        setStudentProfile({});
        setGeneratedIdea('');
    };

    return (
        <div className="min-h-screen flex flex-col bg-black relative">
            {/* Add particle system background */}
            <ParticleSystem />
            
            {/* Header */}
            <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800 p-4 relative z-10">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">Pideas</h1>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-300">Gamified Project Idea Generator</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentView('history')}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            History
                        </button>
                        <span className="text-gray-300">Welcome, {user.displayName}</span>
                        <button
                            onClick={onLogout}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                {currentView === 'welcome' && (
                    <div className="w-full max-w-4xl">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                                Smart Project Ideas for Students
                            </h2>
                            <p className="text-gray-400 text-lg mb-8">
                                Get personalized project ideas through our gamified context-gathering system
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Describe your project domain or interest (e.g., 'web development for e-commerce', 'AI for healthcare', 'mobile app for students')..."
                                    className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            
                            <button
                                onClick={startGameFlow}
                                disabled={!query.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                            >
                                🎮 Start Gamified Project Generation
                            </button>
                            
                            <div className="text-center text-gray-400 text-sm">
                                <p>Answer 7 fun questions to get a perfectly tailored project idea!</p>
                            </div>
                        </div>
                        
                        {/* History Section */}
                        <div className="mt-12">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-white">Your Recent Project Ideas</h3>
                                <span className="text-gray-400 text-sm">{userHistory.length} ideas generated</span>
                            </div>
                            
                            {isLoadingHistory ? (
                                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
                                    <div className="text-gray-400">Loading your project history...</div>
                                </div>
                            ) : userHistory.length === 0 ? (
                                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
                                    <p className="text-gray-400">No project ideas generated yet. Start your first gamified session above!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {userHistory.slice(0, 6).map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setGeneratedIdea(item.idea);
                                                setCurrentView('result');
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-semibold text-white truncate">{item.query}</h4>
                                                <span className="text-green-400 font-medium text-sm ml-2">Score: {item.gameScore}</span>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {item.studentProfile.stream} • {item.studentProfile.skillLevel}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">
                                                {new Date(item.generatedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-blue-400">
                                                Click to view full idea →
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {userHistory.length > 6 && (
                                <div className="text-center mt-4">
                                    <button
                                        onClick={() => setCurrentView('history')}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        View all {userHistory.length} ideas →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentView === 'game' && gameSteps.length > 0 && (
                    <GameStep
                        step={gameSteps[currentStepIndex]}
                        onAnswer={handleGameAnswer}
                        currentScore={currentScore}
                        totalSteps={gameSteps.length}
                    />
                )}

                {currentView === 'generating' && (
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <h3 className="text-2xl font-semibold text-white mb-2">Generating Your Perfect Project Idea</h3>
                            <p className="text-gray-400">Using your responses to create a personalized project...</p>
                            <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
                                <p className="text-green-400 font-medium">Final Score: {currentScore} points</p>
                                <p className="text-gray-300 text-sm mt-1">{studentProfile.stream} • {studentProfile.skillLevel}</p>
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'result' && generatedIdea && (
                    <ProjectIdeaDisplay
                        idea={generatedIdea}
                        onStartNew={startNewIdea}
                    />
                )}

                {currentView === 'history' && (
                    <HistoryView
                        user={user}
                        onBack={() => setCurrentView('welcome')}
                        onViewIdea={(idea) => {
                            setGeneratedIdea(idea);
                            setCurrentView('result');
                        }}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-gray-500 text-sm">
                <p>Powered by <span className="text-white font-medium">AI & Gamification</span></p>
                <div className="mt-2 space-x-4">
                    <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
                </div>
                <p className="mt-2">© 2024 Pideas. All rights reserved.</p>
            </footer>
        </div>
    );
};

// Main App Component
const App = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [firebaseError, setFirebaseError] = useState(null);

    useEffect(() => {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            setFirebaseError('Firebase SDK not loaded. Please ensure you are running this from Firebase hosting or have Firebase configured.');
            setIsInitializing(false);
            return;
        }

        try {
            const auth = firebase.auth();
            
            // Listen for authentication state changes
            const unsubscribe = auth.onAuthStateChanged((user) => {
                setUser(user);
                setIsInitializing(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Firebase initialization error:', error);
            setFirebaseError('Firebase initialization failed: ' + error.message);
            setIsInitializing(false);
        }
    }, []);

    const handleLogin = async () => {
        if (typeof firebase === 'undefined') {
            alert('Firebase not available. Please run from Firebase hosting.');
            return;
        }
        
        setIsLoading(true);
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const auth = firebase.auth();
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Authentication error:', error);
            alert('Login failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (typeof firebase === 'undefined') {
            return;
        }
        
        try {
            const auth = firebase.auth();
            await auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (firebaseError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <ParticleSystem />
                <div className="content text-center z-10">
                    <div className="particle-text">Pideas</div>
                    <div className="mb-8">
                        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-wider">
                            Pideas
                        </h1>
                        <p className="text-gray-400 text-lg mb-4">
                            Project Idea Generator
                        </p>
                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-red-300 text-sm">
                                {firebaseError}
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                                For full functionality, please deploy to Firebase hosting.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen">
            <ParticleSystem />
            {user ? (
                <AppScreen user={user} onLogout={handleLogout} />
            ) : (
                <LoginScreen onLogin={handleLogin} isLoading={isLoading} />
            )}
        </div>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
