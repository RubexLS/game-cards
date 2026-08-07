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

// Mantener el estado local del botón de un solo uso por turno
let yaUsoCartaEsteTurno = false;

export function iniciarNuevoTurno() {
    yaUsoCartaEsteTurno = false;
}

export function obtenerEstadoBotonTurno() {
    return yaUsoCartaEsteTurno;
}

export function registrarUsoCarta() {
    yaUsoCartaEsteTurno = true;
}

// Estructura inicial idéntica al JSON de Firebase
const initialState = {
    game_001: {
        state: "en_progreso",
        turn: true, // true = jugador, false = oponente
        deck: [],
        playerOrange: [],
        playerBlue: [],
        exileZone: [],
        discardZone: [],
        bodyZone: []
    }
};

export const firebaseMock = {
    // exportamos las funciones manteniendo la misma firma que tu Mock
    getGame: async (gameId) => {
        try {
            const gameRef = doc(db, "games", gameRefIdLimpio(gameId));
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
            const gameRef = doc(db, "games", gameRefIdLimpio(gameId));
            await updateDoc(gameRef, newData);
        } catch (error) {
            console.error("Error al actualizar partida en Firebase:", error);
        }
        
    },

    // Herramienta extra: Escucha cambios en tiempo real sin recargar la página
    listenMatch: (gameId, callback) => {
        const gameRef = doc(db, "games", gameRefIdLimpio(gameId));
        return onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            }
        });
    }
};

// Función interna auxiliar para asegurar que usemos el ID correcto de documento
function gameRefIdLimpio(id) {
    return id || "game_001";
}