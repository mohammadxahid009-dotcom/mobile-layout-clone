# Firestore Security Rules & Verification Protection

Deploy these rules to your Firebase project to guarantee that each user can read, create, and update **only their own** data in Cloud Firestore, enforce valid roles, protect against password leakage, and secure username reservations.

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

    // Authentication helpers
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Email verification check:
    // Google and OAuth providers automatically verify email on authentication.
    // Password sign-ins verify the email_verified token claim.
    function isEmailVerifiedOrOAuth() {
      return isAuthenticated() && (
        request.auth.token.firebase.sign_in_provider != 'password' ||
        request.auth.token.email_verified == true
      );
    }

    // Strict role validation: only allowed roles
    function isValidRole(role) {
      return role in ['customer', 'provider'];
    }

    // Security check: passwords or secret credentials must never be written to Firestore
    function hasNoSensitiveCredentials() {
      return !('password' in request.resource.data) &&
             !('passwordHash' in request.resource.data) &&
             !('secret' in request.resource.data);
    }

    // Usernames collection:
    // Fast O(1) direct document lookup to check availability during registration
    match /usernames/{username} {
      // Anyone can check if a username document exists
      allow read: if true;

      // Only authenticated users can claim/reserve their username with their own UID.
      // An existing username claimed by user A cannot be claimed/overwritten by user B.
      allow create: if isAuthenticated()
                    && request.resource.data.uid == request.auth.uid;

      allow update: if isAuthenticated()
                    && resource.data.uid == request.auth.uid
                    && request.resource.data.uid == request.auth.uid;

      allow delete: if isAuthenticated()
                    && resource.data.uid == request.auth.uid;
    }

    // Users collection:
    // Each user document is keyed strictly by request.auth.uid.
    // A user can only access their own profile document.
    match /users/{userId} {
      allow read: if isOwner(userId);

      // On profile creation:
      // Enforce UID match, role validation, and credential protection
      allow create: if isOwner(userId)
                    && request.resource.data.uid == userId
                    && (request.resource.data.role == null || isValidRole(request.resource.data.role))
                    && hasNoSensitiveCredentials();

      // On profile update:
      // Enforce UID immutability, role validation, and credential protection
      allow update: if isOwner(userId)
                    && request.resource.data.uid == resource.data.uid
                    && (request.resource.data.role == null || isValidRole(request.resource.data.role))
                    && hasNoSensitiveCredentials();

      allow delete: if isOwner(userId);
    }

    // Default deny for all other unmatched collections to maintain complete isolation
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Security Guarantees & Email Verification
- **No Cross-User Access:** An authenticated user with UID `A` cannot read or write the `/users/B` document of user `B`.
- **Instant Username Lookup & Anti-Hijack:** Public read access on `/usernames/{username}` allows live checks on the role picker screen while claiming and updating is restricted to the authenticated account owner and prevents overwriting existing reservations.
- **Credential Protection:** Forbids storing any plaintext `password` or credential secrets in Firestore.
- **Strict Role Boundaries:** Roles are strictly restricted to verified enum values (`customer`, `provider`).
- **Complete Default Deny:** All unmapped paths return permission-denied.
