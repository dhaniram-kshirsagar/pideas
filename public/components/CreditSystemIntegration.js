/**
 * Credit System Integration
 * This file contains the modifications needed to integrate the credit system into the main app
 * Include this script after the main app.js and component files
 */

// Credit system state management
const useCreditSystem = () => {
    const [userCredits, setUserCredits] = useState(null);
    const [isLoadingCredits, setIsLoadingCredits] = useState(true);
    const [creditError, setCreditError] = useState(null);

    const functions = typeof firebase !== 'undefined' ? firebase.functions() : null;

    // Load user credits
    const loadUserCredits = async (userId) => {
        if (!functions || !userId) {
            setIsLoadingCredits(false);
            return;
        }

        try {
            const getUserCredits = functions.httpsCallable('getUserCredits');
            const result = await getUserCredits();

            if (result.data.success) {
                setUserCredits(result.data);
                setCreditError(null);
            } else {
                throw new Error(result.data.error || 'Failed to load credits');
            }
        } catch (error) {
            console.error('Error loading user credits:', error);
            setCreditError('Failed to load credit information');
        } finally {
            setIsLoadingCredits(false);
        }
    };

    // Check if user has enough credits for an action
    const checkCredits = async (actionType) => {
        if (!functions) return false;

        try {
            const checkCreditsFunc = functions.httpsCallable('checkCredits');
            const result = await checkCreditsFunc({ actionType });

            return result.data.success && result.data.hasEnoughCredits;
        } catch (error) {
            console.error('Error checking credits:', error);
            return false;
        }
    };

    // Refresh credits after purchase or usage
    const refreshCredits = (userId) => {
        loadUserCredits(userId);
    };

    return {
        userCredits,
        isLoadingCredits,
        creditError,
        loadUserCredits,
        checkCredits,
        refreshCredits
    };
};

// Enhanced User Profile Dropdown with Credit Display
const EnhancedUserProfileDropdown = ({ user, userRole, userCredits, onClose, onLogout, onBillingClick }) => {
    const dropdownRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
    const [targetTilt, setTargetTilt] = useState({ x: 0, y: 0 });
    const animationFrameRef = useRef();
    const lastUpdateTimeRef = useRef(0);
    
    // Linear interpolation function
    const lerp = (start, end, factor) => {
        return start + (end - start) * factor;
    };
    
    // Smooth tilt animation using requestAnimationFrame
    const updateTilt = useCallback(() => {
        const now = performance.now();
        const deltaTime = now - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = now;
        
        setCardTilt((current) => {
            const lerpFactor = Math.min(deltaTime / 16, 1) * 0.15;
            const newX = lerp(current.x, targetTilt.x, lerpFactor);
            const newY = lerp(current.y, targetTilt.y, lerpFactor);
            
            const threshold = 0.1;
            return {
                x: Math.abs(newX - targetTilt.x) < threshold ? targetTilt.x : newX,
                y: Math.abs(newY - targetTilt.y) < threshold ? targetTilt.y : newY,
            };
        });
        
        if (isHovered) {
            animationFrameRef.current = requestAnimationFrame(updateTilt);
        }
    }, [targetTilt, isHovered]);
    
    // Mouse move handler for 3D tilt effect
    const handleMouseMove = useCallback((e) => {
        if (dropdownRef.current && isHovered) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            // Calculate tilt angles (max 8 degrees for subtle effect)
            const maxTilt = 8;
            const tiltX = (mouseY / (rect.height / 2)) * maxTilt * -1;
            const tiltY = (mouseX / (rect.width / 2)) * maxTilt;
            
            const constrainedTiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
            const constrainedTiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY));
            
            setTargetTilt({ x: constrainedTiltX, y: constrainedTiltY });
            
            // Calculate mouse position as percentage for gradients
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePosition({
                x: Math.max(0, Math.min(100, x)),
                y: Math.max(0, Math.min(100, y)),
            });
        }
    }, [isHovered]);
    
    // Generate holographic gradient based on mouse position and tilt
    const getHolographicStyle = () => {
        if (!isHovered) {
            return {
                background: 'transparent',
                transition: 'background 0.15s ease-out',
            };
        }
        
        const { x, y } = mousePosition;
        const { x: tiltX, y: tiltY } = cardTilt;
        
        const tiltIntensity = (Math.abs(tiltX) + Math.abs(tiltY)) / 16;
        const colorIntensity = 0.4 + tiltIntensity * 0.3;
        
        const tiltOffsetX = tiltY * 2;
        const tiltOffsetY = tiltX * 2;
        
        const adjustedX = Math.max(0, Math.min(100, x + tiltOffsetX));
        const adjustedY = Math.max(0, Math.min(100, y + tiltOffsetY));
        
        const gradient1 = `radial-gradient(circle at ${adjustedX}% ${adjustedY}%, rgba(220, 160, 225, ${colorIntensity}) 0%, transparent 50%)`;
        const gradient2 = `radial-gradient(circle at ${100 - adjustedX}% ${100 - adjustedY}%, rgba(30, 210, 220, ${colorIntensity * 0.8}) 0%, transparent 40%)`;
        const gradient3 = `radial-gradient(circle at ${adjustedX}% ${100 - adjustedY}%, rgba(60, 230, 65, ${colorIntensity * 0.9}) 0%, transparent 45%)`;
        
        return {
            background: `${gradient1}, ${gradient2}, ${gradient3}`,
            transition: 'none',
        };
    };
    
    useEffect(() => {
        // Handle click outside to close dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        // Handle escape key to close dropdown
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        
        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        
        // Clean up event listeners
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
            document.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [onClose, handleMouseMove]);
    
    // Animation frame management
    useEffect(() => {
        if (isHovered) {
            lastUpdateTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(updateTilt);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isHovered, updateTilt]);
    
    // Handle logout click
    const handleLogout = (e) => {
        e.preventDefault();
        onClose();
        onLogout();
    };
    
    return (
        <div 
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
            style={{
                transformOrigin: 'top right',
                animation: 'fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                right: '0',
                maxWidth: 'calc(100vw - 20px)',
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
                transition: 'transform 0.1s ease-out'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setMousePosition({ x: 50, y: 50 });
                setCardTilt({ x: 0, y: 0 });
                setTargetTilt({ x: 0, y: 0 });
            }}
        >
            <div className="relative overflow-hidden rounded-xl">
                {/* Cosmic gradient header */}
                <div className="h-32 relative bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-teal-900/50 rounded-t-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/30 to-transparent rounded-t-xl"></div>
                    
                    {/* Holographic overlay */}
                    <div
                        className="absolute inset-0 rounded-t-xl mix-blend-screen opacity-60"
                        style={getHolographicStyle()}
                    ></div>
                </div>
                
                {/* Profile content */}
                <div className="relative -mt-12 z-10 px-6 pb-6">
                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center relative">
                            <div className="w-16 h-16">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path 
                                        d="M50,15 C60,15 70,25 70,40 C70,47 65,55 60,58 C57,60 55,62 55,65 L55,70 C55,72 53,75 50,75 C47,75 45,72 45,70 L45,65 C45,62 43,60 40,58 C35,55 30,47 30,40 C30,25 40,15 50,15 Z" 
                                        fill="none" 
                                        stroke="#1DED83" 
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="40" cy="40" r="5" fill="#1DED83" />
                                    <circle cx="60" cy="40" r="5" fill="#1DED83" />
                                    <path 
                                        d="M35,80 C35,80 40,85 50,85 C60,85 65,80 65,80" 
                                        fill="none" 
                                        stroke="#1DED83" 
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    {/* User info */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-1 font-mono">{user.displayName}</h1>
                        <p className="text-zinc-400 text-sm font-mono">{userRole?.isAdmin ? 'Administrator' : 'Ambassador of Pideas'}</p>
                        
                        {/* Location */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <svg className="w-4 h-4" style={{ color: '#1DED83' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-mono text-white text-sm">Coding Galaxy</span>
                        </div>
                    </div>
                    
                    {/* Bio */}
                    <div className="text-center mb-6">
                        <p className="text-zinc-300 leading-relaxed font-mono text-xs">
                            From the distant Cosmic Ocean,<br/>
                            I travel galaxies to decode mysteries<br/>
                            and collect strange codes.
                        </p>
                    </div>
                    
                    {/* Credit Display */}
                    {userCredits && (
                        <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                            <CreditDisplay 
                                userCredits={userCredits}
                                onPurchaseClick={onBillingClick}
                                className="justify-center"
                            />
                        </div>
                    )}
                    
                    {/* Email */}
                    <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <p className="text-zinc-400 text-xs mb-1 font-mono">Email Address</p>
                        <p className="text-white text-sm font-mono">{user.email}</p>
                    </div>
                    
                    {/* Divider */}
                    <div className="w-full h-px bg-zinc-700 mb-4"></div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onBillingClick}
                            className="flex-1 bg-emerald-800 border border-emerald-700 hover:bg-emerald-700 hover:border-emerald-600 text-emerald-300 py-2 px-4 rounded-lg transition-all duration-200 font-mono text-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            Billing
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 py-2 px-4 rounded-lg transition-all duration-200 font-mono text-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Credit-aware generation function
const generateIdeaWithCreditCheck = async (functions, actionType, generationParams, onInsufficientCredits) => {
    try {
        // Check credits first
        const checkCredits = functions.httpsCallable('checkCredits');
        const creditResult = await checkCredits({ actionType });

        if (!creditResult.data.success || !creditResult.data.hasEnoughCredits) {
            onInsufficientCredits(actionType);
            return { success: false, error: 'insufficient_credits' };
        }

        // Proceed with generation
        const generateIdea = functions.httpsCallable('generateIdea');
        const result = await generateIdea(generationParams);

        return result.data;
    } catch (error) {
        console.error('Error in credit-aware generation:', error);
        throw error;
    }
};

// Export the integration utilities
if (typeof window !== 'undefined') {
    window.CreditSystemIntegration = {
        useCreditSystem,
        EnhancedUserProfileDropdown,
        generateIdeaWithCreditCheck
    };
}
