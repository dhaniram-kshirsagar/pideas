const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin with your service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function makeUserAdmin(email) {
  try {
    console.log(`Attempting to make ${email} an admin...`);
    
    // First, try to find the user by email
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    const userId = userRecord.uid;
    console.log(`Found user with ID: ${userId}`);
    
    // Check if user already has a role
    const userRoleDoc = await db.collection('userRoles').doc(userId).get();
    
    if (userRoleDoc.exists) {
      // Update existing role to admin
      await db.collection('userRoles').doc(userId).update({
        role: 'admin',
        status: 'active',
        lastUpdated: new Date().toISOString()
      });
      console.log(`Updated existing user to admin role`);
    } else {
      // Create new admin role
      await db.collection('userRoles').doc(userId).set({
        userId,
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      console.log(`Created new admin role for user`);
    }
    
    // Add an admin log entry
    await db.collection('adminLogs').add({
      adminId: 'system',
      action: 'MAKE_ADMIN',
      targetUserId: userId,
      timestamp: new Date().toISOString(),
      details: {
        method: 'direct-script',
        email
      }
    });
    
    console.log(`✅ Successfully made ${email} an admin!`);
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    process.exit();
  }
}

// Make the specified email an admin
makeUserAdmin('atharvaa099@gmail.com');
