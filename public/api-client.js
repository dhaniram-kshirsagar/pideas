/**
 * API Client for Python Backend
 * Replaces Firebase Functions calls with HTTP requests to Python FastAPI backend
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get authentication token from Firebase Auth
 */
async function getAuthToken() {
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    return await user.getIdToken();
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const token = await getAuthToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

/**
 * API Functions - Direct replacements for Firebase Functions
 */
window.PythonAPI = {
    /**
     * Get gamification steps
     * Replaces: functions.httpsCallable('getGameSteps')
     */
    async getGameSteps() {
        const response = await apiRequest('/game-steps');
        return { data: response };
    },

    /**
     * Generate project idea
     * Replaces: functions.httpsCallable('generateIdea')
     */
    async generateIdea(data) {
        const response = await apiRequest('/generate-idea', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return { data: response };
    },

    /**
     * Save idea to history
     * Replaces: functions.httpsCallable('saveIdeaToHistory')
     */
    async saveIdeaToHistory(data) {
        const response = await apiRequest('/history', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return { data: response };
    },

    /**
     * Get user history
     * Replaces: functions.httpsCallable('getUserHistory')
     */
    async getUserHistory(data) {
        const userId = data.userId || firebase.auth().currentUser?.uid;
        const limit = data.limit || 20;
        const response = await apiRequest(`/history/${userId}?limit=${limit}`);
        return { data: response };
    },

    /**
     * Get user role
     * Replaces: functions.httpsCallable('getUserRole')
     */
    async getUserRole(data) {
        const userId = data.userId || firebase.auth().currentUser?.uid;
        const response = await apiRequest(`/admin/user-role/${userId}`);
        return { data: response };
    },

    /**
     * Manage users (admin)
     * Replaces: functions.httpsCallable('manageUsers')
     */
    async manageUsers(data) {
        const response = await apiRequest('/admin/manage-users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return { data: response };
    },

    /**
     * Get admin logs
     * Replaces: functions.httpsCallable('getAdminLogs')
     */
    async getAdminLogs(data) {
        const limit = data?.limit || 50;
        const response = await apiRequest(`/admin/logs?limit=${limit}`);
        return { data: response };
    },

    /**
     * Bulk user operations
     * Replaces: functions.httpsCallable('bulkUserOperations')
     */
    async bulkUserOperations(data) {
        const response = await apiRequest('/admin/bulk-operations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return { data: response };
    },

    /**
     * Legacy function names for compatibility
     */
    async getAllUsers(data) {
        return await this.manageUsers({ adminUserId: firebase.auth().currentUser?.uid });
    },

    async getAllIdeas(data) {
        // This would need to be implemented in the Python backend if needed
        console.warn('getAllIdeas not implemented in Python backend');
        return { data: { success: false, message: 'Function not implemented' } };
    },

    async updateUserRole(data) {
        return await this.manageUsers({
            adminUserId: firebase.auth().currentUser?.uid,
            targetUserId: data.userId,
            newRole: data.role
        });
    },

    async modifyIdeaSection(data) {
        // This would need to be implemented if the feature is still needed
        console.warn('modifyIdeaSection not implemented in Python backend');
        return { data: { success: false, message: 'Function not implemented' } };
    }
};

/**
 * Helper function to replace Firebase Functions calls
 * Usage: const result = await callPythonAPI('getGameSteps', data);
 */
window.callPythonAPI = async function(functionName, data = {}) {
    if (typeof window.PythonAPI[functionName] === 'function') {
        return await window.PythonAPI[functionName](data);
    } else {
        throw new Error(`Function ${functionName} not found in Python API`);
    }
};

console.log('Python API Client loaded successfully');
