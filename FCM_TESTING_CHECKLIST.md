# FCM Testing Checklist

## Step 1: Verify Backend Firebase Initialization

When you start the backend server, you should see this log message:
```
[FcmService] Firebase Admin initialized with service account JSON file
```

**Action**: Check your backend console/logs for this message.

---

## Step 2: Verify FCM Token Registration (iOS)

The iOS app needs to:
1. ✅ Have Firebase SDK installed (NOT DONE YET)
2. ✅ Have GoogleService-Info.plist added (NOT DONE YET)
3. ✅ Register for push notifications
4. ✅ Get FCM token
5. ✅ Send FCM token to backend via `POST /users/fcm-token`

**To check**: 
- Look for network request: `POST /users/fcm-token` in your logs
- Check if token is stored: Query your database for users with `fcmToken` field

---

## Step 3: Send a Test Message

To trigger FCM notification:
1. User A sends a message to User B
2. Backend should:
   - Save the message
   - Check if User B has an `fcmToken`
   - Send FCM notification to User B's device
   - Log: "Successfully sent notification: ..." or "Failed to send FCM notification"

**To check**:
- Look for FCM logs in backend console
- Check if recipient receives push notification (if app is in background)
- Check if message appears in real-time (if app is open)

---

## Step 4: What You're Seeing Now

Your current logs show:
- ✅ GET /messages/conversations - Working
- ✅ GET /notifications/count/unread - Working
- ❓ Firebase initialization - Need to check backend logs
- ❓ FCM token registration - Not happening yet (Firebase SDK not in iOS app)
- ❓ FCM notifications - Can't test until iOS setup is complete

---

## Next Steps

1. **Check backend logs** for Firebase initialization message
2. **Complete iOS Firebase setup**:
   - Add Firebase SDK to Xcode project
   - Add GoogleService-Info.plist
   - Uncomment Firebase code in FCMManager.swift and vet_tnApp.swift
3. **Test FCM token registration**:
   - Login to the app
   - Check backend logs for `POST /users/fcm-token` request
4. **Test message sending**:
   - Send a message from one user to another
   - Check backend logs for FCM notification logs
   - Verify recipient receives notification

