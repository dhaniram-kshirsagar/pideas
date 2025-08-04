/**
 * Firebase Functions for Credit Management System
 */

import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import {
  getUserCredits,
  initializeUserCredits,
  hasEnoughCredits,
  deductCredits,
  addCredits,
  updateUserRole,
  getCreditHistory,
  getAvailablePackages,
  validatePackagePurchase,
  CREDIT_PACKAGES,
  UserRole
} from "./credit-management";

/**
 * Get user's current credit balance and role information
 */
export const getUserCreditsFunction = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    let userCredits = await getUserCredits(userId);
    
    // Initialize credits if user doesn't exist
    if (!userCredits) {
      const email = request.auth.token.email || '';
      userCredits = await initializeUserCredits(userId, email, 'free');
    }
    
    return {
      success: true,
      credits: userCredits.credits,
      role: userCredits.role,
      dailyCredits: userCredits.dailyCredits,
      subscription: userCredits.subscription,
      status: userCredits.status
    };
  } catch (error) {
    logger.error("Error getting user credits:", error);
    throw new Error(`Failed to get user credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Check if user has enough credits for a specific action
 */
export const checkCreditsFunction = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { actionType } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    if (!actionType) {
      throw new Error("Action type is required");
    }
    
    const hasCredits = await hasEnoughCredits(userId, actionType);
    
    return {
      success: true,
      hasEnoughCredits: hasCredits
    };
  } catch (error) {
    logger.error("Error checking credits:", error);
    throw new Error(`Failed to check credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get available credit packages for user's current role
 */
export const getAvailablePackagesFunction = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const userCredits = await getUserCredits(userId);
    const userRole = userCredits?.role || 'free';
    
    const packages = getAvailablePackages(userRole);
    
    return {
      success: true,
      packages,
      userRole
    };
  } catch (error) {
    logger.error("Error getting available packages:", error);
    throw new Error(`Failed to get available packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Purchase credits (mock implementation - integrate with Stripe in production)
 */
export const purchaseCreditsFunction = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { packageId, paymentMethodId } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    if (!packageId) {
      throw new Error("Package ID is required");
    }
    
    const userCredits = await getUserCredits(userId);
    if (!userCredits) {
      throw new Error("User credits not found");
    }
    
    // Validate package purchase
    if (!validatePackagePurchase(packageId, userCredits.role)) {
      throw new Error("Invalid package for user role");
    }
    
    // Find package details
    const allPackages = [
      ...Object.values(CREDIT_PACKAGES.free),
      ...Object.values(CREDIT_PACKAGES.pro)
    ];
    
    const packageData = allPackages.find(pkg => pkg.id === packageId);
    if (!packageData) {
      throw new Error("Package not found");
    }
    
    // Mock payment processing (replace with Stripe in production)
    const mockPaymentSuccess = true;
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!mockPaymentSuccess) {
      throw new Error("Payment processing failed");
    }
    
    // Add credits to user account
    const success = await addCredits(userId, packageData.credits, packageId, transactionId);
    
    if (!success) {
      throw new Error("Failed to add credits to account");
    }
    
    // Log purchase in separate collection
    const db = admin.firestore();
    await db.collection('creditPurchases').add({
      userId,
      packageId,
      packageName: packageData.name,
      credits: packageData.credits,
      amount: packageData.price,
      transactionId,
      paymentMethodId,
      status: 'completed',
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return {
      success: true,
      transactionId,
      creditsAdded: packageData.credits,
      packageName: packageData.name,
      amount: packageData.price
    };
  } catch (error) {
    logger.error("Error purchasing credits:", error);
    throw new Error(`Failed to purchase credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get user's credit transaction history
 */
export const getCreditHistoryFunction = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { limit = 50 } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const history = await getCreditHistory(userId, limit);
    
    return {
      success: true,
      history
    };
  } catch (error) {
    logger.error("Error getting credit history:", error);
    throw new Error(`Failed to get credit history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Admin function: Add credits to any user account
 */
export const adminAddCreditsFunction = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { targetUserId, credits, reason } = request.data;
    const adminUserId = request.auth?.uid;
    
    if (!adminUserId) {
      throw new Error("Authentication required");
    }
    
    if (!targetUserId || !credits) {
      throw new Error("Target user ID and credits amount are required");
    }
    
    // Check if user is admin
    const db = admin.firestore();
    const adminDoc = await db.collection('userCredits').doc(adminUserId).get();
    
    if (!adminDoc.exists) {
      throw new Error("Admin user not found");
    }
    
    const adminData = adminDoc.data();
    if (adminData?.role !== 'enterprise') {
      throw new Error("Access denied: Admin privileges required");
    }
    
    // Add credits to target user
    const success = await addCredits(targetUserId, credits, undefined, undefined, adminUserId);
    
    if (!success) {
      throw new Error("Failed to add credits");
    }
    
    // Log admin action
    await db.collection('adminLogs').add({
      adminId: adminUserId,
      action: 'ADD_CREDITS',
      targetUserId,
      details: {
        creditsAdded: credits,
        reason: reason || 'Admin grant'
      },
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return {
      success: true,
      creditsAdded: credits,
      targetUserId
    };
  } catch (error) {
    logger.error("Error adding credits (admin):", error);
    throw new Error(`Failed to add credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Admin function: Update user role
 */
export const adminUpdateUserRoleFunction = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { targetUserId, newRole } = request.data;
    const adminUserId = request.auth?.uid;
    
    if (!adminUserId) {
      throw new Error("Authentication required");
    }
    
    if (!targetUserId || !newRole) {
      throw new Error("Target user ID and new role are required");
    }
    
    // Validate role
    if (!['free', 'pro', 'enterprise'].includes(newRole)) {
      throw new Error("Invalid role");
    }
    
    // Check if user is admin
    const db = admin.firestore();
    const adminDoc = await db.collection('userCredits').doc(adminUserId).get();
    
    if (!adminDoc.exists) {
      throw new Error("Admin user not found");
    }
    
    const adminData = adminDoc.data();
    if (adminData?.role !== 'enterprise') {
      throw new Error("Access denied: Admin privileges required");
    }
    
    // Update user role
    const success = await updateUserRole(targetUserId, newRole as UserRole, adminUserId);
    
    if (!success) {
      throw new Error("Failed to update user role");
    }
    
    // Log admin action
    await db.collection('adminLogs').add({
      adminId: adminUserId,
      action: 'UPDATE_USER_ROLE',
      targetUserId,
      details: {
        newRole
      },
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return {
      success: true,
      newRole,
      targetUserId
    };
  } catch (error) {
    logger.error("Error updating user role (admin):", error);
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Admin function: Get all users with credit information
 */
export const adminGetAllUsersFunction = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { limit = 100, startAfter } = request.data;
    const adminUserId = request.auth?.uid;
    
    if (!adminUserId) {
      throw new Error("Authentication required");
    }
    
    // Check if user is admin
    const db = admin.firestore();
    const adminDoc = await db.collection('userCredits').doc(adminUserId).get();
    
    if (!adminDoc.exists) {
      throw new Error("Admin user not found");
    }
    
    const adminData = adminDoc.data();
    if (adminData?.role !== 'enterprise') {
      throw new Error("Access denied: Admin privileges required");
    }
    
    // Get all users
    let query = db.collection('userCredits')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    const snapshot = await query.get();
    const users: any[] = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        // Convert timestamps to ISO strings for frontend
        createdAt: userData.createdAt?.toDate()?.toISOString(),
        lastLogin: userData.lastLogin?.toDate()?.toISOString(),
        'dailyCredits.lastRefresh': userData.dailyCredits?.lastRefresh?.toDate()?.toISOString()
      });
    });
    
    // Log admin action
    await db.collection('adminLogs').add({
      adminId: adminUserId,
      action: 'VIEW_ALL_USERS',
      details: {
        userCount: users.length,
        limit
      },
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return {
      success: true,
      users,
      hasMore: users.length === limit
    };
  } catch (error) {
    logger.error("Error getting all users (admin):", error);
    throw new Error(`Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Admin function: Get credit usage analytics
 */
export const adminGetCreditAnalyticsFunction = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { days = 30 } = request.data;
    const adminUserId = request.auth?.uid;
    
    if (!adminUserId) {
      throw new Error("Authentication required");
    }
    
    // Check if user is admin
    const db = admin.firestore();
    const adminDoc = await db.collection('userCredits').doc(adminUserId).get();
    
    if (!adminDoc.exists) {
      throw new Error("Admin user not found");
    }
    
    const adminData = adminDoc.data();
    if (adminData?.role !== 'enterprise') {
      throw new Error("Access denied: Admin privileges required");
    }
    
    // Get analytics data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const transactionsSnapshot = await db.collection('creditTransactions')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();
    
    const purchasesSnapshot = await db.collection('creditPurchases')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();
    
    // Process analytics
    let totalCreditsUsed = 0;
    let totalRevenue = 0;
    const actionBreakdown: Record<string, number> = {};
    const roleBreakdown: Record<string, number> = {};
    
    transactionsSnapshot.forEach(doc => {
      const transaction = doc.data();
      if (transaction.type === 'deduction') {
        totalCreditsUsed += Math.abs(transaction.amount);
        if (transaction.actionType) {
          actionBreakdown[transaction.actionType] = (actionBreakdown[transaction.actionType] || 0) + Math.abs(transaction.amount);
        }
      }
    });
    
    purchasesSnapshot.forEach(doc => {
      const purchase = doc.data();
      totalRevenue += purchase.amount || 0;
    });
    
    // Get user role distribution
    const usersSnapshot = await db.collection('userCredits').get();
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
    });
    
    return {
      success: true,
      analytics: {
        totalCreditsUsed,
        totalRevenue,
        actionBreakdown,
        roleBreakdown,
        totalUsers: usersSnapshot.size,
        totalTransactions: transactionsSnapshot.size,
        totalPurchases: purchasesSnapshot.size,
        period: `${days} days`
      }
    };
  } catch (error) {
    logger.error("Error getting credit analytics (admin):", error);
    throw new Error(`Failed to get credit analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
