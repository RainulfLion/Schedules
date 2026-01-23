// Firebase Configuration and Initialization
// Using Firebase v9+ modular SDK (compat mode for easier integration with existing code)

const firebaseConfig = {
  apiKey: "AIzaSyB-X1UIxnANq9nO_1_5-ip6DN581W30H4w",
  authDomain: "security-755b3.firebaseapp.com",
  projectId: "security-755b3",
  storageBucket: "security-755b3.firebasestorage.app",
  messagingSenderId: "644894280494",
  appId: "1:644894280494:web:38b4bf2fae49d8d2f6c8bf",
  measurementId: "G-XG1YYE8MCH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for Firestore
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

// Helper function to create initial user accounts
async function createInitialUsers() {
  const users = [
    { email: 'supervisor@security.com', password: 'super123', role: 'supervisor', name: 'Colin Jorgensen', employeeId: 1 },
    { email: 'ken@security.com', password: 'ken123', role: 'guard', name: 'Ken Zieger', employeeId: 2 },
    { email: 'harvey@security.com', password: 'harvey123', role: 'guard', name: 'Harvey De Los Reyes', employeeId: 3 },
    { email: 'david@security.com', password: 'david123', role: 'guard', name: 'David Dimodica', employeeId: 4 },
    { email: 'manuel@security.com', password: 'manuel123', role: 'guard', name: 'Manuel Gonzalez', employeeId: 5 },
    { email: 'ernest@security.com', password: 'ernest123', role: 'guard', name: 'Ernest Goodlow', employeeId: 6 },
    { email: 'gil@security.com', password: 'gil123', role: 'guard', name: 'Gilberto Romero', employeeId: 7 },
    { email: 'kevin@security.com', password: 'kevin123', role: 'guard', name: 'Kevin Valerio', employeeId: 8 }
  ];

  console.log('To create users, run createInitialUsers() from console');
  console.log('Users:', users.map(u => ({ email: u.email, password: u.password })));
}

// Firebase helper functions
const FirebaseHelpers = {
  // Get user profile data
  async getUserProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  },

  // Create or update user profile
  async setUserProfile(uid, data) {
    await db.collection('users').doc(uid).set(data, { merge: true });
  },

  // Get vacation requests
  async getVacationRequests() {
    const snapshot = await db.collection('vacationRequests').get();
    const requests = {};
    snapshot.forEach(doc => {
      requests[doc.id] = doc.data();
    });
    return requests;
  },

  // Save vacation requests
  async saveVacationRequests(requests) {
    const batch = db.batch();
    Object.entries(requests).forEach(([empId, dates]) => {
      const ref = db.collection('vacationRequests').doc(empId);
      batch.set(ref, dates);
    });
    await batch.commit();
  },

  // Get manual overrides
  async getManualOverrides() {
    const doc = await db.collection('settings').doc('manualOverrides').get();
    return doc.exists ? doc.data().overrides || {} : {};
  },

  // Save manual overrides
  async saveManualOverrides(overrides) {
    await db.collection('settings').doc('manualOverrides').set({ overrides });
  },

  // Listen to vacation requests changes
  onVacationRequestsChange(callback) {
    return db.collection('vacationRequests').onSnapshot(snapshot => {
      const requests = {};
      snapshot.forEach(doc => {
        requests[doc.id] = doc.data();
      });
      callback(requests);
    });
  },

  // Listen to manual overrides changes
  onManualOverridesChange(callback) {
    return db.collection('settings').doc('manualOverrides').onSnapshot(doc => {
      callback(doc.exists ? doc.data().overrides || {} : {});
    });
  }
};

// Make helpers available globally
window.FirebaseHelpers = FirebaseHelpers;
window.auth = auth;
window.db = db;
