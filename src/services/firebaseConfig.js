import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC38POzI1zASM_B_TM6cs6po1oUVOnpyDM",
    authDomain: "md06clothes.firebaseapp.com",
    databaseURL: "https://md06clothes-default-rtdb.firebaseio.com",
    projectId: "md06clothes",
    storageBucket: "md06clothes.firebasestorage.app",
    messagingSenderId: "245208054466",
    appId: "1:245208054466:web:0b2a419729b066c4fd595b",
    measurementId: "G-D1Y9V1JPNZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
