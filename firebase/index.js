const admin = require("firebase-admin");
const serviceAccount = require("./account-creds.json");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    apiKey: "AIzaSyABGXuI7VnEFPcneS804Y_zhNMHhwRPfeo",
    authDomain: "aid-project-af0a9.firebaseapp.com",
    databaseURL: "https://aid-project-af0a9-default-rtdb.firebaseio.com",
    projectId: "aid-project-af0a9",
    storageBucket: "aid-project-af0a9.appspot.com",
    messagingSenderId: "809808896153",
    appId: "1:809808896153:web:fe66ef3eea3b0efbeb9808",
    measurementId: "G-XHL141MHXF"
};

admin.initializeApp(firebaseConfig);

const firebaseAuth = admin.auth();
const firebaseDb = admin.firestore();
const storage = admin.storage();
module.exports = 
{firebaseDb,firebaseAuth,getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,storage}
console.log("Firebase Initialized");