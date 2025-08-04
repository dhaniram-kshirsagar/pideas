/**
 * Credit Management System for Project Idea Generator
 * Handles role-based credit allocation, deduction, and management
 */

import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

// Extended role system with credit tiers
export type UserRole = 'free' | 'pro' | 'enterprise';

// Credit costs by action and role
export const CREDIT_COSTS = {
  direct_generation: {
    free: 5,
    pro: 3,
    enterprise: 0
  },
  discovery_generation: {
    free: 8,
    pro: 5,
    enterprise: 0
  },
  idea_modification: {
    free: 3,
    pro: 2,
    enterprise: 0
  }
};

// Daily credit refresh amounts by role
export const DAILY_CREDITS = {
  free: 0,
  pro: 5,
  enterprise: 0 // Unlimited for enterprise
};

// Credit packages configuration
export const CREDIT_PACKAGES = {
  free: {
    starter: {
      id: 'free_starter',
      name: 'Starter Pack',
      credits: 20,
      price: 4.99,
      description: 'Perfect for trying out the platform',
      features: ['Basic AI generation', 'Email support', '1 day data retention']
    },
    basic: {
      id: 'free_basic',
      name: 'Basic Pack',
      credits: 50,
      price: 9.99,
      description: 'Great for regular use',
      features: ['Basic AI generation', 'Email support', '1 day data retention']
    }
  },
  pro: {
    standard: {
      id: 'pro_standard',
      name: 'Pro Standard',
      credits: 100,
      price: 19.99,
      description: 'For power users',
      features: ['Advanced AI generation', 'Priority support', '7 day data retention']
    },
    premium: {
      id: 'pro_premium',
      name: 'Pro Premium',
      credits: 250,
      price: 39.99,
      description: 'Maximum value pack',
      features: ['Advanced AI generation', 'Priority support', '7 day data retention']
    }
  }
};

// User credit interface
export interface UserCredits {
  userId: string;
  email: string;
  role: UserRole;
  credits: number;
  dailyCredits: {
    remaining: number;
    lastRefresh: admin.firestore.Timestamp;
  };
  subscription?: {
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodEnd: admin.firestore.Timestamp;
    planId: string;
  };
  createdAt: admin.firestore.Timestamp;
  lastLogin?: admin.firestore.Timestamp;
  status: 'active' | 'inactive';
}

// Credit transaction interface
export interface CreditTransaction {
  userId: string;
  type: 'purchase' | 'deduction' | 'refund' | 'admin_grant';
  amount: number;
  actionType?: string;
  packageId?: string;
  transactionId?: string;
  adminId?: string;
  timestamp: admin.firestore.Timestamp;
  metadata?: any;
}

/**
 * Initialize user credits with default values
 */
export async function initializeUserCredits(userId: string, email: string, role: UserRole = 'free'): Promise<UserCredits> {
  const db = admin.firestore();
  
  const initialCredits = role === 'free' ? 3 : role === 'pro' ? 10 : 0;
  
  const userCredits: UserCredits = {
    userId,
    email,
    role,
    credits: initialCredits,
    dailyCredits: {
      remaining: DAILY_CREDITS[role],
      lastRefresh: admin.firestore.Timestamp.now()
    },
    createdAt: admin.firestore.Timestamp.now(),
    status: 'active'
  };
  
  await db.collection('userCredits').doc(userId).set(userCredits);
  
  // Log initial credit grant
  await logCreditTransaction({
    userId,
    type: 'admin_grant',
    amount: initialCredits,
    timestamp: admin.firestore.Timestamp.now(),
    metadata: { reason: 'initial_signup', role }
  });
  
  return userCredits;
}

/**
 * Get user credits with daily refresh check
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const db = admin.firestore();
  const userDoc = await db.collection('userCredits').doc(userId).get();
  
  if (!userDoc.exists) {
    return null;
  }
  
  const userData = userDoc.data() as UserCredits;
  
  // Check if daily refresh is needed
  if (userData.role !== 'free' && userData.role !== 'enterprise') {
    const lastRefresh = userData.dailyCredits.lastRefresh.toDate();
    const now = new Date();
    const daysSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRefresh >= 1) {
      const dailyAmount = DAILY_CREDITS[userData.role];
      
      await db.collection('userCredits').doc(userId).update({
        credits: admin.firestore.FieldValue.increment(dailyAmount),
        'dailyCredits.remaining': dailyAmount,
        'dailyCredits.lastRefresh': admin.firestore.Timestamp.now()
      });
      
      // Log daily refresh
      await logCreditTransaction({
        userId,
        type: 'admin_grant',
        amount: dailyAmount,
        timestamp: admin.firestore.Timestamp.now(),
        metadata: { reason: 'daily_refresh', role: userData.role }
      });
      
      userData.credits += dailyAmount;
      userData.dailyCredits.remaining = dailyAmount;
      userData.dailyCredits.lastRefresh = admin.firestore.Timestamp.now();
    }
  }
  
  return userData;
}

/**
 * Check if user has enough credits for an action
 */
export async function hasEnoughCredits(userId: string, actionType: string): Promise<boolean> {
  const userCredits = await getUserCredits(userId);
  
  if (!userCredits) {
    return false;
  }
  
  // Enterprise users have unlimited credits
  if (userCredits.role === 'enterprise') {
    return true;
  }
  
  const creditCost = CREDIT_COSTS[actionType as keyof typeof CREDIT_COSTS]?.[userCredits.role] || 0;
  return userCredits.credits >= creditCost;
}

/**
 * Deduct credits for an action
 */
export async function deductCredits(userId: string, actionType: string): Promise<boolean> {
  const db = admin.firestore();
  const userCredits = await getUserCredits(userId);
  
  if (!userCredits) {
    return false;
  }
  
  // Enterprise users don't need to deduct credits
  if (userCredits.role === 'enterprise') {
    return true;
  }
  
  const creditCost = CREDIT_COSTS[actionType as keyof typeof CREDIT_COSTS]?.[userCredits.role] || 0;
  
  if (userCredits.credits < creditCost) {
    return false;
  }
  
  // Deduct credits
  await db.collection('userCredits').doc(userId).update({
    credits: admin.firestore.FieldValue.increment(-creditCost)
  });
  
  // Log credit deduction
  await logCreditTransaction({
    userId,
    type: 'deduction',
    amount: -creditCost,
    actionType,
    timestamp: admin.firestore.Timestamp.now()
  });
  
  return true;
}

/**
 * Add credits to user account
 */
export async function addCredits(userId: string, amount: number, packageId?: string, transactionId?: string, adminId?: string): Promise<boolean> {
  const db = admin.firestore();
  
  try {
    await db.collection('userCredits').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(amount)
    });
    
    // Log credit addition
    await logCreditTransaction({
      userId,
      type: packageId ? 'purchase' : 'admin_grant',
      amount,
      packageId,
      transactionId,
      adminId,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return true;
  } catch (error) {
    logger.error('Error adding credits:', error);
    return false;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: UserRole, adminId?: string): Promise<boolean> {
  const db = admin.firestore();
  
  try {
    const userCredits = await getUserCredits(userId);
    if (!userCredits) {
      return false;
    }
    
    await db.collection('userCredits').doc(userId).update({
      role: newRole,
      'dailyCredits.remaining': DAILY_CREDITS[newRole],
      'dailyCredits.lastRefresh': admin.firestore.Timestamp.now()
    });
    
    // Log role change
    await logCreditTransaction({
      userId,
      type: 'admin_grant',
      amount: 0,
      adminId,
      timestamp: admin.firestore.Timestamp.now(),
      metadata: { 
        reason: 'role_change', 
        previousRole: userCredits.role, 
        newRole 
      }
    });
    
    return true;
  } catch (error) {
    logger.error('Error updating user role:', error);
    return false;
  }
}

/**
 * Log credit transaction
 */
export async function logCreditTransaction(transaction: CreditTransaction): Promise<void> {
  const db = admin.firestore();
  
  try {
    await db.collection('creditTransactions').add(transaction);
  } catch (error) {
    logger.error('Error logging credit transaction:', error);
  }
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
  const db = admin.firestore();
  
  try {
    const snapshot = await db.collection('creditTransactions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const transactions: CreditTransaction[] = [];
    snapshot.forEach(doc => {
      transactions.push(doc.data() as CreditTransaction);
    });
    
    return transactions;
  } catch (error) {
    logger.error('Error getting credit history:', error);
    return [];
  }
}

/**
 * Get available credit packages for a user role
 */
export function getAvailablePackages(userRole: UserRole): any[] {
  const packages = [];
  
  if (userRole === 'free') {
    packages.push(...Object.values(CREDIT_PACKAGES.free));
  } else if (userRole === 'pro') {
    packages.push(...Object.values(CREDIT_PACKAGES.pro));
  }
  
  return packages;
}

/**
 * Validate package purchase
 */
export function validatePackagePurchase(packageId: string, userRole: UserRole): boolean {
  const allPackages = [
    ...Object.values(CREDIT_PACKAGES.free),
    ...Object.values(CREDIT_PACKAGES.pro)
  ];
  
  const packageData = allPackages.find(pkg => pkg.id === packageId);
  
  if (!packageData) {
    return false;
  }
  
  // Free users can buy any package
  if (userRole === 'free') {
    return true;
  }
  
  // Pro users can only buy pro packages
  if (userRole === 'pro') {
    return packageId.startsWith('pro_');
  }
  
  // Enterprise users don't need to buy packages
  return false;
}
