// Quick test script to verify Firebase Admin SDK is configured correctly
// Run with: node test-firebase.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Firebase Admin SDK configuration...\n');

// Try to read the service account file
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-service-account.json not found!');
  console.log('Please ensure the file exists in the backend root directory.');
  process.exit(1);
}

try {
  const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  console.log('✅ Service account file found and valid');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}\n`);
  
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully!');
  console.log('✅ FCM is ready to send notifications\n');
  
  // Clean up
  admin.app().delete().then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  });
  
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  if (error.code) {
    console.error(`   Error code: ${error.code}`);
  }
  process.exit(1);
}

