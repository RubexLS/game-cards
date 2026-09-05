const fs = require('fs');
const path = require('path');

const contenido = `import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const firebaseMock = {
    getGame: async (gameId) => {
        try {
            const gameRef = doc(db, "games", gameId);
            const docSnap = await getDoc(gameRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.error("No se encontró la partida en Firebase:", gameId);
                return null;
            }
        } catch (error) {
            console.error("Error al obtener partida de Firebase:", error);
            return null;
        }
    },
    updateGame: async (gameId, newData) => {
        try {
            const gameRef = doc(db, "games", gameId);
            await setDoc(gameRef, newData, { merge: true });
        } catch (error) {
            console.error("Error al actualizar partida en Firebase:", error);
        }
    },
    listenMatch: (gameId, callback) => {
        const gameRef = doc(db, "games", gameId);
        return onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            }else{
                callback({ state: "esperando", unavailablePlayers: [] });
            }
        });
    }
};`;

// Creamos el archivo directamente dentro de la carpeta js/
const rutaArchivo = path.join(__dirname, 'js', 'firebaseMock.js');

fs.writeFileSync(rutaArchivo, contenido, 'utf8');
console.log('¡Archivo firebaseMock.js generado con éxito!');