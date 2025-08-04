/**
 * Billing Page Component - Credit Purchase Interface
 * Based on the pricing page mock design
 */

const BillingPage = ({ user, userCredits, onBack, onPurchaseComplete }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [availablePackages, setAvailablePackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const functions = typeof firebase !== 'undefined' ? firebase.functions() : null;

    // Pricing plans configuration based on the mock
    const pricingPlans = {
        free: {
            id: 'free',
            name: 'Free',
            price: 0,
            period: '/mo',
            description: 'Best for 1-5 users',
            features: [
                { name: 'One workspace', included: true },
                { name: 'Email support', included: true },
                { name: '1 day data retention', included: false },
                { name: 'Custom rules', included: false },
                { name: 'Priority support', included: false },
                { name: 'SSO', included: false }
            ],
            buttonText: 'Get started free',
            buttonVariant: 'secondary',
            credits: 3,
            dailyRefresh: 0
        },
        pro: {
            id: 'pro',
            name: 'Pro',
            price: 79,
            period: '/mo',
            description: 'Best for 5-50 users',
            features: [
                { name: 'Five workspaces', included: true },
                { name: 'Email support', included: true },
                { name: '7 day data retention', included: true },
                { name: 'Custom rules', included: true },
                { name: 'Priority support', included: false },
                { name: 'SSO', included: false }
            ],
            buttonText: '14-day free trial',
            buttonVariant: 'primary',
            credits: 200,
            dailyRefresh: 5,
            popular: true
        },
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            price: null,
            period: '',
            description: 'Best for 50+ users',
            features: [
                { name: 'Unlimited workspaces', included: true },
                { name: 'Email support', included: true },
                { name: '30 day data retention', included: true },
                { name: 'Custom rules', included: true },
                { name: 'Priority support', included: true },
                { name: 'SSO', included: true }
            ],
            buttonText: 'Contact us',
            buttonVariant: 'secondary',
            credits: 'Unlimited',
            dailyRefresh: 'N/A'
        }
    };

    // Credit packages for one-time purchases
    const creditPackages = {
        starter: {
            id: 'starter_pack',
            name: 'Starter Pack',
            credits: 20,
            price: 4.99,
            description: 'Perfect for trying out advanced features',
            popular: false
        },
        basic: {
            id: 'basic_pack',
            name: 'Basic Pack',
            credits: 50,
            price: 9.99,
            description: 'Great for regular users',
            popular: true
        },
        premium: {
            id: 'premium_pack',
            name: 'Premium Pack',
            credits: 150,
            price: 24.99,
            description: 'Best value for power users',
            popular: false
        }
    };

    useEffect(() => {
        loadAvailablePackages();
    }, []);

    const loadAvailablePackages = async () => {
        if (!functions) {
            setIsLoading(false);
            return;
        }

        try {
            const getPackages = functions.httpsCallable('getAvailablePackages');
            const result = await getPackages();

            if (result.data.success) {
                setAvailablePackages(result.data.packages);
            }
        } catch (error) {
            console.error('Error loading packages:', error);
            setError('Failed to load pricing information');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlanSelect = (planId) => {
        setSelectedPlan(planId);
    };

    const handleSubscribe = async (planId) => {
        if (!functions || isProcessing) return;

        setIsProcessing(true);
        setError(null);

        try {
            // For demo purposes, we'll simulate the subscription process
            // In production, this would integrate with Stripe or similar payment processor
            
            if (planId === 'enterprise') {
                // Redirect to contact form or open contact modal
                alert('Please contact our sales team for Enterprise pricing and setup.');
                return;
            }

            if (planId === 'free') {
                alert('You are already on the free plan!');
                return;
            }

            // Simulate payment processing
            const mockPaymentSuccess = confirm(`Subscribe to ${pricingPlans[planId].name} plan for $${pricingPlans[planId].price}/month?`);
            
            if (!mockPaymentSuccess) {
                return;
            }

            // In production, this would call a subscription management function
            alert(`Successfully subscribed to ${pricingPlans[planId].name} plan! Your account will be upgraded shortly.`);
            
            if (onPurchaseComplete) {
                onPurchaseComplete();
            }

        } catch (error) {
            console.error('Error processing subscription:', error);
            setError('Failed to process subscription. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreditPurchase = async (packageId) => {
        if (!functions || isProcessing) return;

        setIsProcessing(true);
        setError(null);

        try {
            const purchaseCredits = functions.httpsCallable('purchaseCredits');
            const result = await purchaseCredits({
                packageId: packageId,
                paymentMethodId: 'mock_payment_method' // In production, this would come from Stripe
            });

            if (result.data.success) {
                alert(`Successfully purchased ${result.data.creditsAdded} credits!`);
                
                if (onPurchaseComplete) {
                    onPurchaseComplete();
                }
            } else {
                throw new Error(result.data.message || 'Purchase failed');
            }

        } catch (error) {
            console.error('Error purchasing credits:', error);
            setError('Failed to purchase credits. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const FeatureIcon = ({ included }) => (
        <svg 
            className={`w-5 h-5 ${included ? 'text-blue-500' : 'text-gray-500'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
        >
            {included ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            )}
        </svg>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading pricing information...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-gray-800 p-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onBack}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold">Billing & Pricing</h1>
                    </div>
                    <div className="text-sm text-gray-400">
                        Current Credits: <span className="text-white font-bold">{userCredits?.credits || 0}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8">
                {/* Pricing Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Pricing</h2>
                    <p className="text-gray-400 text-lg">
                        Use it for free for yourself, upgrade when your team needs advanced control.
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {/* Subscription Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {Object.entries(pricingPlans).map(([planId, plan]) => (
                        <div 
                            key={planId}
                            className={`relative border rounded-xl p-6 transition-all duration-200 hover:border-gray-600 ${
                                plan.popular ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 bg-gray-900/50'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-blue-600 text-white text-xs py-1 px-3 rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <div className="mb-2">
                                    {plan.price !== null ? (
                                        <>
                                            <span className="text-4xl font-bold">${plan.price}</span>
                                            <span className="text-gray-400">{plan.period}</span>
                                        </>
                                    ) : (
                                        <span className="text-4xl font-bold">Contact us</span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <FeatureIcon included={feature.included} />
                                        <span className={feature.included ? 'text-white' : 'text-gray-500'}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(planId)}
                                disabled={isProcessing}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                    plan.buttonVariant === 'primary'
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-gray-800 text-white border border-gray-600 hover:bg-gray-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isProcessing ? 'Processing...' : plan.buttonText}
                            </button>

                            {/* Credit information */}
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="text-sm text-gray-400 text-center">
                                    <div>Credits: <span className="text-white">{plan.credits}</span></div>
                                    {plan.dailyRefresh > 0 && (
                                        <div>Daily Refresh: <span className="text-white">{plan.dailyRefresh}</span></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* One-time Credit Packages */}
                <div className="border-t border-gray-800 pt-12">
                    <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold mb-4">One-Time Credit Packages</h3>
                        <p className="text-gray-400">
                            Need more credits? Purchase additional credits without a subscription.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(creditPackages).map(([packageId, pkg]) => (
                            <div 
                                key={packageId}
                                className={`border rounded-xl p-6 transition-all duration-200 hover:border-gray-600 ${
                                    pkg.popular ? 'border-emerald-500 bg-emerald-950/20' : 'border-gray-700 bg-gray-900/50'
                                }`}
                            >
                                {pkg.popular && (
                                    <div className="text-center mb-4">
                                        <span className="bg-emerald-600 text-white text-xs py-1 px-3 rounded-full">
                                            Best Value
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h4 className="text-xl font-bold mb-2">{pkg.name}</h4>
                                    <div className="mb-2">
                                        <span className="text-3xl font-bold text-emerald-400">{pkg.credits}</span>
                                        <span className="text-gray-400 ml-1">credits</span>
                                    </div>
                                    <div className="mb-3">
                                        <span className="text-2xl font-bold">${pkg.price}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{pkg.description}</p>
                                </div>

                                <button
                                    onClick={() => handleCreditPurchase(pkg.id)}
                                    disabled={isProcessing}
                                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Processing...' : 'Purchase Credits'}
                                </button>

                                <div className="mt-4 text-center text-sm text-gray-400">
                                    ${(pkg.price / pkg.credits).toFixed(3)} per credit
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Current Plan Info */}
                {userCredits && (
                    <div className="mt-12 p-6 bg-gray-900/50 border border-gray-700 rounded-xl">
                        <h4 className="text-xl font-bold mb-4">Your Current Plan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Plan:</span>
                                <div className="text-white font-medium capitalize">{userCredits.role}</div>
                            </div>
                            <div>
                                <span className="text-gray-400">Available Credits:</span>
                                <div className="text-white font-medium">{userCredits.credits}</div>
                            </div>
                            {userCredits.dailyCredits && (
                                <div>
                                    <span className="text-gray-400">Daily Credits:</span>
                                    <div className="text-white font-medium">{userCredits.dailyCredits.remaining}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export the component
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BillingPage;
}
