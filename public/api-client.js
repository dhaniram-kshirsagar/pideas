/**
 * API Client for Python Firebase Functions
 * Provides direct access to Python Firebase Functions
 */

/**
 * API Functions - Direct access to Firebase Functions
 */
window.PythonAPI = {
    /**
     * Get gamification steps
     * Uses: firebase.functions().httpsCallable('getGameSteps')
     */
    async getGameSteps() {
        const functions = firebase.functions();
        const getGameSteps = functions.httpsCallable('getGameSteps');
        return await getGameSteps({});
    },

    /**
     * Generate project idea
     * Uses: firebase.functions().httpsCallable('generateProjectIdea')
     */
    async generateIdea(data) {
        const functions = firebase.functions();
        const generateProjectIdea = functions.httpsCallable('generateProjectIdea');
        return await generateProjectIdea(data);
    },

    /**
     * Save idea to history
     * Uses: firebase.functions().httpsCallable('saveIdeaToHistory')
     */
    async saveIdeaToHistory(data) {
        const functions = firebase.functions();
        const saveIdeaToHistory = functions.httpsCallable('saveIdeaToHistory');
        return await saveIdeaToHistory(data);
    },

    /**
     * Get user history
     * Uses: firebase.functions().httpsCallable('getUserHistory')
     */
    async getUserHistory(data) {
        const functions = firebase.functions();
        const getUserHistory = functions.httpsCallable('getUserHistory');
        return await getUserHistory(data);
    },

    /**
     * Get user role
     * Uses: firebase.functions().httpsCallable('getUserRole')
     */
    async getUserRole(data) {
        const functions = firebase.functions();
        const getUserRole = functions.httpsCallable('getUserRole');
        return await getUserRole(data);
    },

    /**
     * Manage users (admin)
     * Uses: firebase.functions().httpsCallable('manageUsers')
     */
    async manageUsers(data) {
        const functions = firebase.functions();
        const manageUsers = functions.httpsCallable('manageUsers');
        return await manageUsers(data);
    },

    /**
     * Get admin logs
     * Uses: firebase.functions().httpsCallable('getAdminLogs')
     */
    async getAdminLogs(data) {
        const functions = firebase.functions();
        const getAdminLogs = functions.httpsCallable('getAdminLogs');
        return await getAdminLogs(data);
    },

    /**
     * Bulk user operations
     * Uses: firebase.functions().httpsCallable('bulkUserOperations')
     */
    async bulkUserOperations(data) {
        const functions = firebase.functions();
        const bulkUserOperations = functions.httpsCallable('bulkUserOperations');
        return await bulkUserOperations(data);
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
