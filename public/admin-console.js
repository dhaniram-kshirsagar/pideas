const { useState, useEffect, useRef } = React;

// Admin Console Components

// User Management Table Component
const UserManagementTable = ({ users, onUpdateUser, onBulkAction, isLoading }) => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkAction, setBulkAction] = useState('');
    const [bulkRole, setBulkRole] = useState('user');
    const [bulkStatus, setBulkStatus] = useState('active');

    // Filter and sort users
    const filteredUsers = users
        .filter(user => 
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.userId.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            const direction = sortDirection === 'asc' ? 1 : -1;
            
            if (sortField === 'createdAt' || sortField === 'lastLogin') {
                return direction * (new Date(bVal || 0).getTime() - new Date(aVal || 0).getTime());
            }
            
            return direction * (aVal > bVal ? 1 : -1);
        });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        setSelectedUsers(
            selectedUsers.length === filteredUsers.length 
                ? [] 
                : filteredUsers.map(user => user.userId)
        );
    };

    const handleBulkAction = () => {
        if (!bulkAction || selectedUsers.length === 0) return;
        
        onBulkAction({
            userIds: selectedUsers,
            action: bulkAction,
            newRole: bulkRole,
            newStatus: bulkStatus
        });
        
        setSelectedUsers([]);
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <span className="text-gray-500">↕</span>;
        return <span className="text-blue-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">User Management</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex items-center gap-4">
                        <span className="text-blue-300">{selectedUsers.length} users selected</span>
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                        >
                            <option value="">Select Action</option>
                            <option value="changeRole">Change Role</option>
                            <option value="changeStatus">Change Status</option>
                        </select>
                        
                        {bulkAction === 'changeRole' && (
                            <select
                                value={bulkRole}
                                onChange={(e) => setBulkRole(e.target.value)}
                                className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}
                        
                        {bulkAction === 'changeStatus' && (
                            <select
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                                className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        )}
                        
                        <button
                            onClick={handleBulkAction}
                            disabled={!bulkAction}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-1 rounded transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded"
                                />
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={() => handleSort('email')}
                            >
                                <div className="flex items-center gap-2">
                                    Email <SortIcon field="email" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={() => handleSort('role')}
                            >
                                <div className="flex items-center gap-2">
                                    Role <SortIcon field="role" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-2">
                                    Status <SortIcon field="status" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center gap-2">
                                    Created <SortIcon field="createdAt" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:text-blue-400 transition-colors"
                                onClick={() => handleSort('lastLogin')}
                            >
                                <div className="flex items-center gap-2">
                                    Last Login <SortIcon field="lastLogin" />
                                </div>
                            </th>
                            <th className="text-left p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className="text-center p-8 text-gray-400">
                                    Loading users...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center p-8 text-gray-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.userId} className="border-b border-gray-700/50 hover:bg-gray-800/20">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.userId)}
                                            onChange={() => handleSelectUser(user.userId)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="p-3 text-white">{user.email}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            user.role === 'admin' 
                                                ? 'bg-purple-900/50 text-purple-300 border border-purple-700' 
                                                : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            user.status === 'active' 
                                                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                                                : 'bg-red-900/50 text-red-300 border border-red-700'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-300">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-gray-300">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <select
                                                value={user.role}
                                                onChange={(e) => onUpdateUser(user.userId, { newRole: e.target.value })}
                                                className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-gray-600"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <select
                                                value={user.status}
                                                onChange={(e) => onUpdateUser(user.userId, { newStatus: e.target.value })}
                                                className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-gray-600"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Ideas Management Component
const IdeasManagement = ({ ideas, onSearch, isLoading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIdeas, setExpandedIdeas] = useState(new Set());

    const handleSearch = (query) => {
        setSearchQuery(query);
        onSearch(query);
    };

    const toggleExpanded = (ideaId) => {
        setExpandedIdeas(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ideaId)) {
                newSet.delete(ideaId);
            } else {
                newSet.add(ideaId);
            }
            return newSet;
        });
    };

    const exportData = (format) => {
        const dataStr = format === 'json' 
            ? JSON.stringify(ideas, null, 2)
            : ideas.map(idea => ({
                userId: idea.userId,
                query: idea.query,
                generatedAt: idea.generatedAt,
                gameScore: idea.gameScore
            })).map(row => Object.values(row).join(',')).join('\n');
        
        const dataBlob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ideas-export.${format}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Ideas Management</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search ideas..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={() => exportData('csv')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => exportData('json')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                        Export JSON
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center p-8 text-gray-400">Loading ideas...</div>
                ) : ideas.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">No ideas found</div>
                ) : (
                    ideas.map((idea) => (
                        <div key={idea.id} className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-white mb-1">{idea.query}</h4>
                                    <div className="text-sm text-gray-400 mb-2">
                                        User: {idea.userId} • Score: {idea.gameScore} • {new Date(idea.generatedAt).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleExpanded(idea.id)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {expandedIdeas.has(idea.id) ? 'Collapse' : 'Expand'}
                                </button>
                            </div>
                            
                            {expandedIdeas.has(idea.id) && (
                                <div className="mt-4 p-4 bg-gray-800/50 rounded border border-gray-600">
                                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                        {idea.idea}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Admin Activity Logs Component
const AdminLogs = ({ logs, isLoading }) => {
    return (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Admin Activity Logs</h3>
            
            <div className="space-y-2">
                {isLoading ? (
                    <div className="text-center p-8 text-gray-400">Loading logs...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">No activity logs found</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex justify-between items-center p-3 bg-gray-700/20 rounded border border-gray-600">
                            <div className="flex-1">
                                <span className="text-white font-medium">{log.action}</span>
                                {log.targetUserId && (
                                    <span className="text-gray-400 ml-2">→ {log.targetUserId}</span>
                                )}
                            </div>
                            <div className="text-sm text-gray-400">
                                {new Date(log.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Main Admin Console Component
const AdminConsole = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [ideas, setIdeas] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        checkAdminAccess();
    }, [user]);

    useEffect(() => {
        if (userRole?.isAdmin) {
            loadData();
        }
    }, [activeTab, userRole]);

    const checkAdminAccess = async () => {
        try {
            const functions = firebase.functions();
            const getUserRole = functions.httpsCallable('getUserRole');
            const result = await getUserRole({ userId: user.uid });
            
            if (result.data.success) {
                setUserRole(result.data);
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const functions = firebase.functions();
            
            if (activeTab === 'users') {
                const getAllUsers = functions.httpsCallable('getAllUsers');
                const result = await getAllUsers({ adminUserId: user.uid });
                if (result.data.success) {
                    setUsers(result.data.users);
                }
            } else if (activeTab === 'ideas') {
                const getAllIdeas = functions.httpsCallable('getAllIdeas');
                const result = await getAllIdeas({ adminUserId: user.uid });
                if (result.data.success) {
                    setIdeas(result.data.ideas);
                }
            } else if (activeTab === 'logs') {
                const getAdminLogs = functions.httpsCallable('getAdminLogs');
                const result = await getAdminLogs({ adminUserId: user.uid });
                if (result.data.success) {
                    setLogs(result.data.logs);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (targetUserId, updates) => {
        try {
            const functions = firebase.functions();
            const updateUserRole = functions.httpsCallable('updateUserRole');
            const result = await updateUserRole({
                adminUserId: user.uid,
                targetUserId,
                ...updates
            });
            
            if (result.data.success) {
                // Refresh users list
                loadData();
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleBulkAction = async (bulkData) => {
        try {
            const functions = firebase.functions();
            const bulkUserOperations = functions.httpsCallable('bulkUserOperations');
            const result = await bulkUserOperations({
                adminUserId: user.uid,
                ...bulkData
            });
            
            if (result.data.success) {
                // Refresh users list
                loadData();
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
        }
    };

    const handleSearchIdeas = async (searchQuery) => {
        try {
            const functions = firebase.functions();
            const getAllIdeas = functions.httpsCallable('getAllIdeas');
            const result = await getAllIdeas({ 
                adminUserId: user.uid,
                searchQuery 
            });
            
            if (result.data.success) {
                setIdeas(result.data.ideas);
            }
        } catch (error) {
            console.error('Error searching ideas:', error);
        }
    };

    if (!userRole) {
        return (
            <div className="max-w-4xl mx-auto text-center">
                <div className="text-white">Checking admin access...</div>
            </div>
        );
    }

    if (!userRole.isAdmin) {
        return (
            <div className="max-w-4xl mx-auto text-center">
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-red-300 mb-4">Access Denied</h2>
                    <p className="text-red-200 mb-6">You don't have admin privileges to access this console.</p>
                    <button
                        onClick={onBack}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Back to App
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Admin Console</h1>
                <button
                    onClick={onBack}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Back to App
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8">
                {[
                    { id: 'users', label: 'User Management', count: users.length },
                    { id: 'ideas', label: 'Ideas Management', count: ideas.length },
                    { id: 'logs', label: 'Activity Logs', count: logs.length }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800/30 text-gray-300 hover:bg-gray-800/50'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-2 px-2 py-1 bg-gray-700 rounded-full text-xs">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
                <UserManagementTable
                    users={users}
                    onUpdateUser={handleUpdateUser}
                    onBulkAction={handleBulkAction}
                    isLoading={isLoading}
                />
            )}

            {activeTab === 'ideas' && (
                <IdeasManagement
                    ideas={ideas}
                    onSearch={handleSearchIdeas}
                    isLoading={isLoading}
                />
            )}

            {activeTab === 'logs' && (
                <AdminLogs
                    logs={logs}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

// Export for use in main app
window.AdminConsole = AdminConsole;
