const { useState, useEffect, useRef } = React;

// Admin Console Components

// Stats Card Component
const StatsCard = ({ title, value, subtitle, color = 'blue', icon }) => {
    const colorClasses = {
        blue: 'from-blue-600 to-blue-800 border-blue-500',
        purple: 'from-purple-600 to-purple-800 border-purple-500',
        green: 'from-green-600 to-green-800 border-green-500',
        orange: 'from-orange-600 to-orange-800 border-orange-500'
    };
    
    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white text-2xl font-bold">{value}</h3>
                    <p className="text-gray-200 text-sm font-medium">{title}</p>
                    {subtitle && <p className="text-gray-300 text-xs mt-1">{subtitle}</p>}
                </div>
                {icon && (
                    <div className="text-white/70 text-3xl">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

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
        <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">👥</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">User Management</h3>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-800/80 text-white px-4 py-2 pl-10 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            🔍
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/40 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{selectedUsers.length}</span>
                            </div>
                            <span className="text-purple-300 font-medium">users selected</span>
                        </div>
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                            className="bg-gray-800/80 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none"
                        >
                            <option value="">Select Action</option>
                            <option value="changeRole">Change Role</option>
                            <option value="changeStatus">Change Status</option>
                        </select>
                        
                        {bulkAction === 'changeRole' && (
                            <select
                                value={bulkRole}
                                onChange={(e) => setBulkRole(e.target.value)}
                                className="bg-gray-800/80 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}
                        
                        {bulkAction === 'changeStatus' && (
                            <select
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                                className="bg-gray-800/80 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        )}
                        
                        <button
                            onClick={handleBulkAction}
                            disabled={!bulkAction}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Apply Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-purple-500/20">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-purple-500/30">
                            <th className="text-left p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-purple-600 bg-gray-700 border-purple-500/30 rounded focus:ring-purple-500 focus:ring-2"
                                />
                            </th>
                            <th 
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('email')}
                            >
                                <div className="flex items-center gap-2 font-semibold text-gray-200">
                                    📧 Email <SortIcon field="email" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('role')}
                            >
                                <div className="flex items-center gap-2 font-semibold text-gray-200">
                                    👤 Role <SortIcon field="role" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-2 font-semibold text-gray-200">
                                    🟢 Status <SortIcon field="status" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center gap-2 font-semibold text-gray-200">
                                    📅 Created <SortIcon field="createdAt" />
                                </div>
                            </th>
                            <th 
                                className="text-left p-4 cursor-pointer hover:text-purple-400 transition-colors group"
                                onClick={() => handleSort('lastLogin')}
                            >
                                <div className="flex items-center gap-2 font-semibold text-gray-200">
                                    🕒 Last Login <SortIcon field="lastLogin" />
                                </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-gray-200">⚙️ Actions</th>
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
                            filteredUsers.map((user, index) => (
                                <tr key={user.userId} className="border-b border-purple-500/10 hover:bg-gradient-to-r hover:from-purple-900/20 hover:to-blue-900/20 transition-all duration-300">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.userId)}
                                            onChange={() => handleSelectUser(user.userId)}
                                            className="w-4 h-4 text-purple-600 bg-gray-700 border-purple-500/30 rounded focus:ring-purple-500 focus:ring-2"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white font-medium">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            user.role === 'admin' 
                                                ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-purple-100 shadow-lg shadow-purple-500/25' 
                                                : 'bg-gradient-to-r from-blue-600 to-blue-800 text-blue-100 shadow-lg shadow-blue-500/25'
                                        }`}>
                                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            user.status === 'active' 
                                                ? 'bg-gradient-to-r from-green-600 to-green-800 text-green-100 shadow-lg shadow-green-500/25' 
                                                : 'bg-gradient-to-r from-red-600 to-red-800 text-red-100 shadow-lg shadow-red-500/25'
                                        }`}>
                                            {user.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-gray-300 font-medium">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '❌ Never'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <select
                                                value={user.role}
                                                onChange={(e) => onUpdateUser(user.userId, { newRole: e.target.value })}
                                                className="bg-gray-800/80 text-white px-3 py-1 rounded-lg text-xs border border-purple-500/30 focus:border-purple-400 focus:outline-none hover:bg-gray-700/80 transition-colors"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <select
                                                value={user.status}
                                                onChange={(e) => onUpdateUser(user.userId, { newStatus: e.target.value })}
                                                className="bg-gray-800/80 text-white px-3 py-1 rounded-lg text-xs border border-purple-500/30 focus:border-purple-400 focus:outline-none hover:bg-gray-700/80 transition-colors"
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
        <div className="bg-gray-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">💡</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Ideas Management</h3>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search ideas..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="bg-gray-800/80 text-white px-4 py-2 pl-10 rounded-lg border border-blue-500/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            🔍
                        </div>
                    </div>
                    <button
                        onClick={() => exportData('csv')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        📊 Export CSV
                    </button>
                    <button
                        onClick={() => exportData('json')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        📄 Export JSON
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center p-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-gray-400 mt-4 font-medium">Loading ideas...</p>
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="text-center p-12">
                        <div className="text-6xl mb-4">💡</div>
                        <p className="text-gray-400 font-medium">No ideas found</p>
                        <p className="text-gray-500 text-sm mt-2">Ideas will appear here once users generate them</p>
                    </div>
                ) : (
                    ideas.map((idea, index) => (
                        <div key={idea.id} className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-400/40 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <h4 className="text-xl font-bold text-white">{idea.query}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">👤</span>
                                            <span className="text-gray-300 font-medium">{idea.userId}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">🎯</span>
                                            <span className="px-2 py-1 bg-gradient-to-r from-orange-600 to-red-600 text-orange-100 rounded-full text-xs font-bold">
                                                Score: {idea.gameScore}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">📅</span>
                                            <span className="text-gray-300 font-medium">{new Date(idea.generatedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleExpanded(idea.id)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                        expandedIdeas.has(idea.id)
                                            ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                                    }`}
                                >
                                    {expandedIdeas.has(idea.id) ? '🔼 Collapse' : '🔽 Expand'}
                                </button>
                            </div>
                            
                            {expandedIdeas.has(idea.id) && (
                                <div className="mt-6 p-6 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-blue-500/20">
                                    <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
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
    const getActionIcon = (action) => {
        const iconMap = {
            'VIEW_ALL_USERS': '👀',
            'UPDATE_USER_ROLE': '🔄',
            'BULK_USER_OPERATIONS': '⚡',
            'VIEW_ALL_IDEAS': '💡',
            'EXPORT_DATA': '📤',
            'LOGIN': '🔐',
            'LOGOUT': '🚪'
        };
        return iconMap[action] || '📝';
    };

    const getActionColor = (action) => {
        const colorMap = {
            'VIEW_ALL_USERS': 'from-blue-600 to-blue-800',
            'UPDATE_USER_ROLE': 'from-purple-600 to-purple-800',
            'BULK_USER_OPERATIONS': 'from-orange-600 to-orange-800',
            'VIEW_ALL_IDEAS': 'from-green-600 to-green-800',
            'EXPORT_DATA': 'from-cyan-600 to-cyan-800',
            'LOGIN': 'from-emerald-600 to-emerald-800',
            'LOGOUT': 'from-red-600 to-red-800'
        };
        return colorMap[action] || 'from-gray-600 to-gray-800';
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Admin Activity Logs</h3>
            </div>
            
            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center p-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                        <p className="text-gray-400 mt-4 font-medium">Loading activity logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-12">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-gray-400 font-medium">No activity logs found</p>
                        <p className="text-gray-500 text-sm mt-2">Admin actions will be logged here</p>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div key={log.id} className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 hover:border-green-400/40 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-10 h-10 bg-gradient-to-r ${getActionColor(log.action)} rounded-full flex items-center justify-center shadow-lg`}>
                                        <span className="text-white text-lg">{getActionIcon(log.action)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white font-bold text-lg">{log.action.replace(/_/g, ' ')}</span>
                                            {log.targetUserId && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">→</span>
                                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-blue-100 rounded-full text-xs font-bold">
                                                        {log.targetUserId}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-gray-400">🕒</span>
                                            <span className="text-gray-300 text-sm font-medium">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-green-400 text-xs font-bold">#{index + 1}</span>
                                    </div>
                                </div>
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
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">🛡️</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Admin Console
                        </h1>
                        <p className="text-gray-400 font-medium">Manage users, ideas, and system activity</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    ← Back to App
                </button>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value={users.length}
                    subtitle="Registered users"
                    color="purple"
                    icon="👥"
                />
                <StatsCard
                    title="Generated Ideas"
                    value={ideas.length}
                    subtitle="Project ideas created"
                    color="blue"
                    icon="💡"
                />
                <StatsCard
                    title="Admin Actions"
                    value={logs.length}
                    subtitle="Recent activity logs"
                    color="green"
                    icon="📊"
                />
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-8 bg-gray-900/50 backdrop-blur-sm p-2 rounded-xl border border-purple-500/20">
                {[
                    { id: 'users', label: 'User Management', count: users.length, icon: '👥', color: 'purple' },
                    { id: 'ideas', label: 'Ideas Management', count: ideas.length, icon: '💡', color: 'blue' },
                    { id: 'logs', label: 'Activity Logs', count: logs.length, icon: '📊', color: 'green' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-lg font-medium transition-all duration-300 flex-1 ${
                            activeTab === tab.id
                                ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-800 text-white shadow-lg shadow-${tab.color}-500/25`
                                : 'bg-gray-800/30 text-gray-300 hover:bg-gray-800/50 hover:text-white'
                        }`}
                    >
                        <span className="text-xl">{tab.icon}</span>
                        <div className="flex-1 text-left">
                            <div className="font-bold">{tab.label}</div>
                            {tab.count > 0 && (
                                <div className="text-xs opacity-80">{tab.count} items</div>
                            )}
                        </div>
                        {activeTab === tab.id && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
