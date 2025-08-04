/**
 * Admin Credit Management Component
 * Allows administrators to manage user credits, roles, and view analytics
 */

const AdminCreditManagement = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [newRole, setNewRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const functions = typeof firebase !== 'undefined' ? firebase.functions() : null;

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'analytics') {
            loadAnalytics();
        }
    }, [activeTab]);

    const loadUsers = async () => {
        if (!functions) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const getAllUsers = functions.httpsCallable('adminGetAllUsers');
            const result = await getAllUsers({ limit: 100 });

            if (result.data.success) {
                setUsers(result.data.users);
            } else {
                throw new Error(result.data.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setError('Failed to load users. Please check your admin permissions.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadAnalytics = async () => {
        if (!functions) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const getAnalytics = functions.httpsCallable('adminGetCreditAnalytics');
            const result = await getAnalytics({ days: 30 });

            if (result.data.success) {
                setAnalytics(result.data.analytics);
            } else {
                throw new Error(result.data.error || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            setError('Failed to load analytics. Please check your admin permissions.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCredits = async () => {
        if (!functions || !selectedUser || !creditAmount || isProcessing) return;

        setIsProcessing(true);
        setError(null);

        try {
            const addCredits = functions.httpsCallable('adminAddCredits');
            const result = await addCredits({
                targetUserId: selectedUser.id,
                credits: parseInt(creditAmount),
                reason: 'Admin grant'
            });

            if (result.data.success) {
                alert(`Successfully added ${creditAmount} credits to ${selectedUser.email}`);
                setCreditAmount('');
                setSelectedUser(null);
                loadUsers(); // Refresh user list
            } else {
                throw new Error(result.data.error || 'Failed to add credits');
            }
        } catch (error) {
            console.error('Error adding credits:', error);
            setError('Failed to add credits. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateRole = async (userId, role) => {
        if (!functions || isProcessing) return;

        setIsProcessing(true);
        setError(null);

        try {
            const updateRole = functions.httpsCallable('adminUpdateUserRole');
            const result = await updateRole({
                targetUserId: userId,
                newRole: role
            });

            if (result.data.success) {
                alert(`Successfully updated user role to ${role}`);
                loadUsers(); // Refresh user list
            } else {
                throw new Error(result.data.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            setError('Failed to update user role. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString();
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'enterprise': return 'bg-purple-900 text-purple-200 border-purple-700';
            case 'pro': return 'bg-blue-900 text-blue-200 border-blue-700';
            case 'free': return 'bg-gray-900 text-gray-200 border-gray-700';
            default: return 'bg-gray-900 text-gray-200 border-gray-700';
        }
    };

    const TabButton = ({ id, label, isActive, onClick }) => (
        <button
            onClick={() => onClick(id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="w-full max-w-7xl mx-auto bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back
                    </button>
                    <h2 className="text-2xl font-bold text-white">Credit Management</h2>
                </div>
                <div className="flex gap-2">
                    <TabButton 
                        id="users" 
                        label="Users" 
                        isActive={activeTab === 'users'} 
                        onClick={setActiveTab} 
                    />
                    <TabButton 
                        id="analytics" 
                        label="Analytics" 
                        isActive={activeTab === 'analytics'} 
                        onClick={setActiveTab} 
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border-b border-red-700 text-red-200">
                    {error}
                </div>
            )}

            <div className="p-6">
                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        {/* Search and Add Credits Section */}
                        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Search Users
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by email or user ID..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Add Credits */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Add Credits to User
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedUser?.id || ''}
                                        onChange={(e) => {
                                            const user = users.find(u => u.id === e.target.value);
                                            setSelectedUser(user);
                                        }}
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select user...</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.email} ({user.credits} credits)
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        placeholder="Credits"
                                        min="1"
                                        className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleAddCredits}
                                        disabled={!selectedUser || !creditAmount || isProcessing}
                                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-400">Loading users...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Role</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Credits</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Daily Credits</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Created</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Last Login</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <div className="text-white font-medium">{user.email}</div>
                                                        <div className="text-gray-400 text-sm">{user.id}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-white font-mono">
                                                    {user.credits}
                                                </td>
                                                <td className="py-3 px-4 text-white font-mono">
                                                    {user.dailyCredits?.remaining || 0}
                                                </td>
                                                <td className="py-3 px-4 text-gray-300">
                                                    {formatDate(user.createdAt)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-300">
                                                    {formatDate(user.lastLogin)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                        disabled={isProcessing}
                                                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    >
                                                        <option value="free">Free</option>
                                                        <option value="pro">Pro</option>
                                                        <option value="enterprise">Enterprise</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-400">Loading analytics...</div>
                        ) : analytics ? (
                            <div className="space-y-6">
                                {/* Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Total Users</div>
                                        <div className="text-2xl font-bold text-white">{analytics.totalUsers}</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Credits Used</div>
                                        <div className="text-2xl font-bold text-white">{analytics.totalCreditsUsed}</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Total Revenue</div>
                                        <div className="text-2xl font-bold text-white">${analytics.totalRevenue.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Purchases</div>
                                        <div className="text-2xl font-bold text-white">{analytics.totalPurchases}</div>
                                    </div>
                                </div>

                                {/* Role Distribution */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">User Role Distribution</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(analytics.roleBreakdown).map(([role, count]) => (
                                            <div key={role} className="text-center">
                                                <div className="text-2xl font-bold text-white">{count}</div>
                                                <div className={`text-sm px-2 py-1 rounded ${getRoleBadgeColor(role)}`}>
                                                    {role} users
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Breakdown */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Credit Usage by Action</h3>
                                    <div className="space-y-3">
                                        {Object.entries(analytics.actionBreakdown).map(([action, credits]) => (
                                            <div key={action} className="flex justify-between items-center">
                                                <span className="text-gray-300 capitalize">
                                                    {action.replace('_', ' ')}
                                                </span>
                                                <span className="text-white font-mono">{credits} credits</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-center text-gray-400 text-sm">
                                    Analytics for the last {analytics.period}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">No analytics data available.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Export the component
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminCreditManagement;
}
