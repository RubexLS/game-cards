export const GAME_ID = 'game_001';

// objeto exportado para mantener la referencia online
export let gameState = {
    deck: [],
    exileZone: [],
    status: true,
    activePlayers: [],
    playerOrange: [], playerBlue: [], playerRed: [], playerYellow: [], playerGreen: [],
    bodyOrange: [], bodyBlue: [], bodyRed: [], bodyYellow: [], bodyGreen: []
};

//Estado global del jugador, mano y cuerpo
export let MI_ROL = null;
export let HAND_KEY = null;
export let BODY_KEY = null;

export const MAP_ROL = {
    'playerO': { mano: 'playerOrange', cuerpo: 'bodyOrange' },
    'playerB': { mano: 'playerBlue',   cuerpo: 'bodyBlue' },
    'playerR': { mano: 'playerRed',    cuerpo: 'bodyRed' },
    'playerY': { mano: 'playerYellow', cuerpo: 'bodyYellow' },
    'playerG': { mano: 'playerGreen',  cuerpo: 'bodyGreen' }
};

// Asignacion de jugador. mano y cyerpo al usuario
export function assignPlayer(idButton) {
    MI_ROL = idButton;
    HAND_KEY = MAP_ROL[idButton].mano;
    BODY_KEY = MAP_ROL[idButton].cuerpo;

    // localStorage.setItem(`rol_${GAME_ID}`, idButton); // solo para online
}

// Shorthand para mantener compatibilidad con cada uno de los eventos del juego
export function getStatus() { 
    return gameState.status === HAND_KEY;
}