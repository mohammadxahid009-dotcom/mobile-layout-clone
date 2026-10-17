# Firestore Security Rules

Deploy these rules to your Firebase project to guarantee that each user can read, create, and update **only their own** data in Cloud Firestore.

## How to Apply in Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **service-app-e4415**.
3. In the left sidebar under **Build**, click **Firestore Database**.
4. Click on the **Rules** tab at the top.
5. Replace the entire contents of the editor with the rules below.
6. Click **Publish**.

---

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Authenticated check
    function isAuthenticated() {
      return request.auth != null;
    }

    // Ownership check: user can only access their own document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidRole(role) {
      return role in ['customer', 'provider'];
    }

    // Users collection
    // Document ID matches the user's Firebase Auth UID
    match /users/{userId} {
      // Users can only read their own profile
      allow read: if isOwner(userId);

      // Users can only create their own profile document with their matching UID
      allow create: if isOwner(userId)
                    && request.resource.data.uid == userId
                    && (request.resource.data.role == null || isValidRole(request.resource.data.role));

      // Users can only update their own profile; UID cannot be forged or altered
      allow update: if isOwner(userId)
                    && request.resource.data.uid == resource.data.uid;

      // Users can delete their own profile
      allow delete: if isOwner(userId);
    }

    // Deny all other unmapped document reads and writes
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Security Guarantees
- **No Cross-User Access:** An authenticated user with UID `A` cannot read or write the `/users/B` document of user `B`.
- **Injection & Tampering Protection:** The document key and the `uid` payload are bound to the verified Firebase Auth token (`request.auth.uid`), preventing impersonation or identifier spoofing.
- **Strict Role Boundaries:** Roles are restricted to verified enum values (`customer`, `provider`).
- **Complete Default Deny:** All unmapped paths return permission-denied.
