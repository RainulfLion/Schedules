# Firebase Integration Setup Guide

## Overview
Your Security Guard Scheduler is now integrated with Firebase for:
- **Authentication**: Secure user login with email/password
- **Firestore Database**: Real-time data synchronization across all devices
- **Offline Support**: Works offline and syncs when connection is restored

---

## 🔧 Setup Steps

### Step 1: Set Up Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/project/security-755b3/firestore)
2. Click on **"Firestore Database"** in the left sidebar
3. Click on the **"Rules"** tab
4. Replace the existing rules with the contents of `firestore.rules` file
5. Click **"Publish"**

**The rules file is located at:** `/home/user/Schedules/firestore.rules`

**What these rules do:**
- All authenticated users can read data
- Guards can manage their own vacation requests
- Only supervisors can modify schedules and manual overrides
- Users can only view their own profile data

---

### Step 2: Create User Accounts

You need to create Firebase user accounts for all employees.

**Option A: Use the Setup Tool (Recommended)**

1. Open `setup-users.html` in your web browser
2. Click "Create All Users" button
3. Wait for the process to complete
4. Check the logs to ensure all users were created successfully

**Option B: Manual Creation via Firebase Console**

1. Go to [Authentication](https://console.firebase.google.com/project/security-755b3/authentication/users)
2. Click "Add user"
3. Create each user with their email and password

**User Accounts to Create:**

| Email | Password | Role | Name | Employee ID |
|-------|----------|------|------|-------------|
| supervisor@security.com | super123 | Supervisor | Colin Jorgensen | 1 |
| harvey@security.com | harvey123 | Guard | Harvey De Los Reyes | 3 |
| david@security.com | david123 | Guard | David Dimodica | 4 |
| manuel@security.com | manuel123 | Guard | Manuel Gonzalez | 5 |
| ernest@security.com | ernest123 | Guard | Ernest Goodlow | 6 |
| gil@security.com | gil123 | Guard | Gilberto Romero | 7 |
| kevin@security.com | kevin123 | Guard | Kevin Valerio | 8 |

---

### Step 3: Initialize Sample Data (Optional)

If you want to start with some sample vacation requests:

1. Go to [Firestore Database](https://console.firebase.google.com/project/security-755b3/firestore)
2. Click "Start collection"
3. Collection ID: `vacationRequests`
4. Add documents for sample vacation requests

**Example Document:**
- Document ID: `4` (David's employee ID)
- Fields:
  ```
  2026-01-16: { status: "approved" }
  2026-01-17: { status: "approved" }
  ```

---

## 🚀 How to Use

### Logging In

Users can log in using either:
- **Username**: `supervisor`, `ken`, `harvey`, etc.
- **Email**: `supervisor@security.com`, `ken@security.com`, etc.

Both methods work with the same passwords.

### Features

✅ **Real-time Sync**: Changes made by supervisors are instantly visible to all users
✅ **Offline Support**: Application works offline and syncs when reconnected
✅ **Secure**: Only authenticated users can access the application
✅ **Role-based Access**: Guards can only see their own schedules; supervisors see everything

---

## 📁 Files Changed/Created

### New Files:
- `firebase-config.js` - Firebase configuration and helper functions
- `setup-users.html` - User account creation tool
- `firestore.rules` - Security rules for Firestore
- `FIREBASE_SETUP.md` - This documentation

### Modified Files:
- `index.html` - Added Firebase SDK scripts
- `schedule-manager.jsx` - Integrated Firebase Auth and Firestore

---

## 🔐 Security Rules Explained

The Firestore security rules ensure:

1. **Authentication Required**: All users must be logged in
2. **Role-based Access**:
   - Supervisors can read/write everything
   - Guards can only read their own data
   - Vacation requests can be submitted by anyone
   - Only supervisors can modify schedules

3. **Data Protection**:
   - User profiles are protected
   - Sensitive operations require supervisor role
   - All write operations are validated

---

## 🐛 Troubleshooting

### "Login failed" error
- Check that the user account exists in Firebase Authentication
- Verify the password is correct
- Check browser console for specific error messages

### Data not syncing
- Check internet connection
- Verify Firestore rules are published
- Check browser console for permission errors

### "Permission denied" errors
- Ensure Firestore security rules are properly set up
- Verify user has the correct role in their profile document
- Check that the user is authenticated

### Users can't be created
- Ensure Email/Password authentication is enabled
- Check for duplicate email addresses
- Verify Firebase project quotas aren't exceeded

---

## 🔄 Data Migration from LocalStorage

The application previously used localStorage. Firebase will start with an empty database. To migrate existing data:

1. Open the application with old localStorage data
2. The data will be in browser's localStorage
3. Manually recreate vacation requests and manual overrides in the new system

---

## 📊 Firestore Database Structure

```
/users/{userId}
  - email: string
  - role: "supervisor" | "guard"
  - name: string
  - employeeId: number
  - createdAt: timestamp

/vacationRequests/{employeeId}
  - {dateString}: { status: "pending" | "approved" | "denied" }

/settings/manualOverrides
  - overrides: {
      "{employeeId}_{dateString}": {
        status: string,
        location: string,
        hours: number,
        time: string,
        manual: boolean
      }
    }
```

---

## ⚙️ Production Recommendations

Before deploying to production:

1. **Change Passwords**: Update all user passwords to strong, unique values
2. **Email Verification**: Enable email verification in Firebase Authentication
3. **Rate Limiting**: Enable Firebase App Check to prevent abuse
4. **Backup**: Set up automated Firestore backups
5. **Monitoring**: Enable Firebase Analytics and Performance Monitoring
6. **Domain Restrictions**: Add authorized domains in Firebase Console

---

## 📞 Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/project/security-755b3)

For application issues:
- Check browser console for errors
- Verify all setup steps were completed
- Review Firestore security rules

---

## ✨ Next Steps

1. ✅ Run `setup-users.html` to create user accounts
2. ✅ Set up Firestore security rules
3. ✅ Test login with supervisor and guard accounts
4. ✅ Test vacation request functionality
5. ✅ Test drag-and-drop schedule updates
6. ✅ Verify real-time sync across multiple browser tabs/devices

---

**Firebase Project**: security-755b3
**Integration Date**: 2026-01-23
**Version**: 1.0
