/**
 * Firebase Functions Deployment Script with Gemini API Key Configuration
 * 
 * This script helps automate the process of:
 * 1. Setting the Gemini API key in Firebase config
 * 2. Building the TypeScript functions
 * 3. Deploying the functions to Firebase
 * 
 * Usage: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Gemini API Key - This will be used for deployment
const GEMINI_API_KEY = "AIzaSyDUjnzrjkGat_c36-w1d2MOqpBwNBdcbqs";

// Create .runtimeconfig.json for local development
const runtimeConfig = {
  gemini: {
    key: GEMINI_API_KEY
  }
};

// Save runtime config for local development
fs.writeFileSync(
  path.join(__dirname, '.runtimeconfig.json'), 
  JSON.stringify(runtimeConfig, null, 2)
);

console.log('🔑 Created .runtimeconfig.json for local development');

try {
  // Set Firebase environment variables
  console.log('🔧 Setting Gemini API key as environment variable...');
  // Create .env file for deployment
  fs.writeFileSync(
    path.join(__dirname, '.env'),
    `GEMINI_API_KEY=${GEMINI_API_KEY}\n`
  );
  console.log('📄 Created .env file with Gemini API key');
  
  // Create or update .env.local file for local development
  fs.writeFileSync(
    path.join(__dirname, '.env.local'),
    `GEMINI_API_KEY=${GEMINI_API_KEY}\n`
  );
  console.log('📄 Created .env.local file for local development');
  
  // Build TypeScript functions
  console.log('🏗️ Building TypeScript functions...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Deploy functions
  console.log('🚀 Deploying functions to Firebase...');
  execSync('firebase deploy --only functions', { stdio: 'inherit' });
  
  console.log('✅ Deployment completed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  
  // Provide helpful error messages
  if (error.message.includes('not logged in')) {
    console.log('📌 Try running "firebase login" first');
  } else if (error.message.includes('not found')) {
    console.log('📌 Make sure Firebase CLI is installed: npm install -g firebase-tools');
  } else if (error.message.includes('timeout')) {
    console.log('📌 Deployment timed out. Check your internet connection and try again');
  }
  
  process.exit(1);
}
