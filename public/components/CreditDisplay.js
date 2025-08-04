/**
 * Credit Display Component
 * Shows user's current credit balance and provides quick access to purchase more
 */

const CreditDisplay = ({ userCredits, onPurchaseClick, className = "" }) => {
    const [isHovered, setIsHovered] = useState(false);

    if (!userCredits) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                <span className="text-gray-400 text-sm">Loading...</span>
            </div>
        );
    }

    const getRoleColor = (role) => {
        switch (role) {
            case 'enterprise': return 'text-purple-400 border-purple-500';
            case 'pro': return 'text-blue-400 border-blue-500';
            case 'free': return 'text-gray-400 border-gray-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'enterprise':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                );
            case 'pro':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                );
            case 'free':
            default:
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.001-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.549.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H9a1 1 0 100-2H8.017a7.36 7.36 0 010-1H9a1 1 0 100-2h-.528c.044-.184.135-.357.264-.521z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div 
            className={`flex items-center gap-3 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Role Badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getRoleColor(userCredits.role)}`}>
                {getRoleIcon(userCredits.role)}
                <span className="capitalize">{userCredits.role}</span>
            </div>

            {/* Credits Display */}
            <div className="flex flex-col gap-2">
                {/* Current Credits */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-400 text-xs">Remaining:</span>
                    </div>
                    <span className="text-white font-mono font-bold">{userCredits.credits}</span>
                </div>
                
                {/* Total Credits (if available) */}
                {userCredits.totalCredits && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-400 text-xs">Total:</span>
                        </div>
                        <span className="text-blue-400 font-mono font-medium">{userCredits.totalCredits}</span>
                    </div>
                )}
                
                {/* Credits Progress Bar */}
                {userCredits.totalCredits && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                        <div 
                            className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((userCredits.credits / userCredits.totalCredits) * 100, 100)}%` }}
                        ></div>
                    </div>
                )}

                {/* Daily Credits (if applicable) */}
                {userCredits.dailyCredits && userCredits.dailyCredits.remaining > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>Daily bonus:</span>
                        </div>
                        <span className="text-blue-400 font-mono text-xs">+{userCredits.dailyCredits.remaining}</span>
                    </div>
                )}
            </div>

            {/* Purchase Button */}
            {userCredits.role !== 'enterprise' && (
                <button
                    onClick={onPurchaseClick}
                    className={`px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium transition-all duration-200 ${
                        isHovered ? 'scale-105' : ''
                    }`}
                >
                    Buy More
                </button>
            )}

            {/* Low Credits Warning */}
            {userCredits.credits < 5 && userCredits.role !== 'enterprise' && (
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Low credits</span>
                </div>
            )}
        </div>
    );
};

// Export the component
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreditDisplay;
}
