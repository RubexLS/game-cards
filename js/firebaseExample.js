import { initializeApp } from "www.gstatic.com/";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from "www.gstatic.com/";

const firebaseConfig = {

    apiKey: "XXXXXXXXX-XXXXXXXXXXXX_XXXXXXXXXXXXXXXX",
    authDomain: "XXXX-XXXXX.firebaseapp.com",
    projectId: "XXXX-XXXXX",
    storageBucket: "XXXX-XXXXX.firebasestorage.app",
    messagingSenderId: "XXXXXXXXXXXX",
    appId: "X:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXXXXX"

    };

// Inicializamos la conexión con Google Firebase
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

    // Actualiza los campos en tiempo real en la nube de Firebase
    updateGame: async (gameId, newData) => {
        try {
            const gameRef = doc(db, "games", gameId);
            await setDoc(gameRef, newData, { merge: true });
        } catch (error) {
            console.error("Error al actualizar partida en Firebase:", error);
        }
        
    },

    // Herramienta extra: Escucha cambios en tiempo real sin recargar la página
    listenMatch: (gameId, callback) => {
        const gameRef = doc(db, "games", gameId);
        return onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            }else{
                // Si la sala se está escuchando pero está completamente vacía (recién creada)
                callback({ state: "esperando", unavailablePlayers: [] });
            }
        });
    }
};