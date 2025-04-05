
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDRzlB75y7ote-GoQLHzMoXbCBMRmaAuQ4",
  authDomain: "tarefasplus2.firebaseapp.com",
  projectId: "tarefasplus2",
  storageBucket: "tarefasplus2.firebasestorage.app",
  messagingSenderId: "958119312198",
  appId: "1:958119312198:web:477f44621b73e0d3f70347",
  measurementId: "G-CLVM0J0Z3T"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const db = getFirestore(app);

export {db};