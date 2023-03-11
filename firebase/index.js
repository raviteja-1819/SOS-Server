import {
    initializeApp
} from "firebase-admin/app";
import admin from "firebase-admin";
import {
    getAuth
} from "firebase-admin/auth";
// var admin = require("firebase-admin")
import serviceAccount from "./aid-project-af0a9-firebase-adminsdk-3qv20-a21b19fcda.json"assert { type: 'json' };
// var serviceAccount = require("/aid-project-af0a9-firebase-adminsdk-3qv20-a21b19fcda.json");
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
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

export const firebaseApp = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const fibaseDb = getFirestore(firebaseApp);
console.log("Firebase Initialized");