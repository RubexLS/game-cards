const DB_KEY = 'firebase_mock_juego_cartas';

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
    // Simula leer el documento de la partida de Firebase
    getGame: async (gameId) => {
        // Simulamos un retraso de red de 200ms
        await new Promise(resolve => setTimeout(resolve, 200)); 
        const db = JSON.parse(localStorage.getItem(DB_KEY)) || estadoInicial;
        return db[gameId] || null;
    },

    // Simula actualizar campos específicos en Firebase
    updateGame: async (gameId, newData) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const db = JSON.parse(localStorage.getItem(DB_KEY)) || initialState;
        
        if (db[gameId]) {
            // Fusionamos los datos antiguos con los nuevos, tal como hace Firebase
            db[gameId] = { ...db[gameId], ...newData };
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        }
    }
};