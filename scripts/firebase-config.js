// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARpOoxslTduQr5_FeGfiBjwZNzwYdR0p8",
    authDomain: "roblovato.github.io",
    projectId: "agendum-ce066",
    // storageBucket: "your-storage-bucket",
    // messagingSenderId: "your-messaging-sender-id",
    appId: "1:829530599970:ios:30eeca81f0cba89f7b907b"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized");
}

// Initialize Firestore
const db = firebase.firestore();

// Make db available globally
window.db = db; 