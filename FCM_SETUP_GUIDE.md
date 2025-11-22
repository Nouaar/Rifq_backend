# FCM (Firebase Cloud Messaging) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for real-time messaging in the Rifq application.

## Backend Setup

### 1. Firebase Admin SDK Configuration

The backend uses Firebase Admin SDK to send push notifications. You need to configure Firebase credentials using one of the following methods (tried in order):

#### Option A: Using Service Account JSON File (Easiest - Already Configured! ✅)

The Firebase service account file has been created at the root of the backend:
- **File**: `firebase-service-account.json`
- **Status**: ✅ Already configured and tested

The backend will automatically use this file when it starts. No additional configuration needed!

**Security Note**: This file is already added to `.gitignore` to prevent committing sensitive credentials.

#### Option B: Using Service Account JSON Environment Variable (For Production/CI/CD)

1. Get your service account JSON (already available at `firebase-service-account.json`)
2. Minify it to a single line:
   ```bash
   cat firebase-service-account.json | jq -c .
   ```
3. Set the environment variable:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"rifq-7294b",...}'
   ```
   Or in `.env` file:
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"rifq-7294b",...}
   ```

#### Option C: Using Individual Environment Variables

Set these environment variables:

```bash
export FIREBASE_PROJECT_ID=rifq-7294b
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@rifq-7294b.iam.gserviceaccount.com
```

**Note:** Make sure to escape the private key properly. The `\n` characters are important.

#### Option D: Using Default Credentials (For Local Development with gcloud CLI)

```bash
gcloud auth application-default login
```

### 2. Verify Firebase Configuration

Test that Firebase is configured correctly:

```bash
cd /Users/mac/Documents/dam/rifq_backend
node test-firebase.js
```

You should see:
```
✅ Service account file found and valid
✅ Firebase Admin SDK initialized successfully!
✅ FCM is ready to send notifications
```

### 3. Start the Backend

The backend will automatically initialize Firebase when it starts:

```bash
npm run start:dev
```

Look for this log message:
```
[FcmService] Firebase Admin initialized with service account JSON file
```

### 3. Backend Implementation Complete

The following has been implemented:
- ✅ Firebase Admin SDK installed (`firebase-admin`)
- ✅ FCM service created (`src/modules/fcm/fcm.service.ts`)
- ✅ User schema updated with `fcmToken` field
- ✅ Endpoint to update FCM token: `POST /users/fcm-token`
- ✅ FCM notifications integrated into messages service
- ✅ Notifications sent when messages are created

## iOS Frontend Setup

### 1. Add Firebase SDK to Xcode Project

1. Open `vet.tn.xcodeproj` in Xcode
2. Go to **File > Add Package Dependencies...**
3. Enter the package URL: `https://github.com/firebase/firebase-ios-sdk`
4. Select version: **Latest (11.x or higher)**
5. Select these products:
   - **FirebaseMessaging**
   - **FirebaseCore** (automatically included as dependency)
6. Click **Add Package**

### 2. Add GoogleService-Info.plist

1. Go to Firebase Console > Project Settings > General
2. Scroll to "Your apps" section
3. If iOS app is not added:
   - Click "Add app" > Select iOS
   - Enter Bundle ID: `com.yourcompany.vet.tn` (check your actual bundle ID in Xcode)
   - Click "Register app"
4. Download `GoogleService-Info.plist`
5. Drag it into your Xcode project (make sure "Copy items if needed" is checked)
6. Ensure it's added to your app target

### 3. Enable Push Notifications Capability

1. In Xcode, select your project target
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability**
4. Add **Push Notifications**
5. Add **Background Modes** and check:
   - ✅ Remote notifications

### 4. Enable APNs Key in Firebase

1. In Firebase Console > Project Settings > Cloud Messaging
2. Under "Apple app configuration", upload your APNs Key or Certificate
   - For development: Use APNs Authentication Key (.p8 file) - recommended
   - Or upload APNs Certificate (.p12 file)
3. Enter your Key ID and Team ID from Apple Developer account

### 5. Update Code (Uncomment Firebase Imports)

After adding Firebase SDK, uncomment the following in these files:

#### `vet.tn/ViewModel/FCMManager.swift`:
- Uncomment: `import Firebase` and `import FirebaseMessaging`
- Uncomment the Firebase token retrieval code in `getFCMToken()`
- Uncomment `MessagingDelegate` extension at the bottom

#### `vet.tn/vet_tnApp.swift`:
- Uncomment: `import Firebase` and `import FirebaseMessaging`
- Uncomment Firebase initialization in `AppDelegate.didFinishLaunchingWithOptions`
- Uncomment APNS token forwarding in `didRegisterForRemoteNotificationsWithDeviceToken`

### 6. Update AppDelegate

The AppDelegate is already configured. Just uncomment the Firebase initialization lines once the SDK is added.

## Testing

### Backend Testing

1. Start the backend server:
   ```bash
   cd /Users/mac/Documents/dam/rifq_backend
   npm run start:dev
   ```

2. Test FCM token endpoint:
   ```bash
   curl -X POST http://localhost:3000/users/fcm-token \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"fcmToken":"test-token-123"}'
   ```

3. Send a test message - notification should be sent automatically

### iOS Testing

1. Build and run the app on a physical device (push notifications don't work on simulator)
2. Log in to the app
3. Check console logs for FCM token registration
4. Send a message from another user
5. You should receive a push notification

## Troubleshooting

### Backend Issues

1. **Firebase not initialized**: Check environment variables are set correctly
2. **Invalid token error**: Token format is incorrect or expired
3. **Permission denied**: Check Firebase service account has proper permissions

### iOS Issues

1. **No FCM token**: 
   - Check Firebase SDK is added correctly
   - Verify `GoogleService-Info.plist` is in the project
   - Check console logs for errors

2. **Notifications not received**:
   - Verify APNs certificate/key is uploaded to Firebase
   - Check device has internet connection
   - Verify app has notification permissions
   - Check FCM token is sent to backend

3. **Token not sent to backend**:
   - Verify user is authenticated
   - Check network logs
   - Verify endpoint `/users/fcm-token` exists and works

## Architecture

### Message Flow

1. User A sends a message via `POST /messages`
2. Backend saves message to database
3. Backend retrieves recipient's FCM token from user document
4. Backend sends FCM notification to recipient's device
5. Recipient's device receives notification
6. App handles notification and refreshes chat UI

### Notification Payload

```json
{
  "type": "message",
  "conversationId": "conversation_id",
  "messageId": "message_id",
  "senderName": "John Doe"
}
```

## Security Notes

1. FCM tokens are stored in the database and updated when users log in
2. Only authenticated users can update their FCM token
3. Notifications are only sent to valid, registered tokens
4. Invalid tokens are automatically cleaned up by Firebase

## Next Steps

1. Add Firebase SDK to iOS project
2. Configure Firebase credentials in backend
3. Test end-to-end message flow
4. Monitor Firebase Console for delivery statistics
5. Handle notification tap actions for better UX

