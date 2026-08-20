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

// Función interna auxiliar para asegurar el uso de ID correcto de documento
function gameRefId(id) { return id || "game_001"; }

export const firebaseMock = {
    getGame: async (gameId) => {
        try {
            const gameRef = doc(db, "games", gameRefId(gameId));
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
            const gameRef = doc(db, "games", gameRefId(gameId));
            await updateDoc(gameRef, newData);
        } catch (error) {
            console.error("Error al actualizar partida en Firebase:", error);
        }
        
    },

    // Herramienta extra: Escucha cambios en tiempo real sin recargar la página
    listenMatch: (gameId, callback) => {
        const gameRef = doc(db, "games", gameRefId(gameId));
        return onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            }
        });
    }
};