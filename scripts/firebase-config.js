// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARpOoxslTduQr5_FeGfiBjwZNzwYdR0p8",
    authDomain: "agendum-ce066.firebaseapp.com",
    projectId: "agendum-ce066",
    storageBucket: "agendum-ce066.appspot.com",
    messagingSenderId: "829530599970",
    appId: "1:829530599970:web:30eeca81f0cba89f7b907b"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore
const db = firebase.firestore();

// Make db available globally
window.db = db;

// Add basic error handling for network state
window.addEventListener('online', () => {
    console.log('Network connection restored');
});

window.addEventListener('offline', () => {
    console.log('Network connection lost');
}); 