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

// Control del robo de cartas
export let inDrawPhase = false;

export function resetDrawPhase() {
    inDrawPhase = false;
}

export function startDrawPhase() {
    inDrawPhase = true;
}

// Verifica si un cuerpo específico ha ganado (4 órganos diferentes y sanos)
export function checkBodyVictory(bodyCards) {

    if (!bodyCards || !Array.isArray(bodyCards) || bodyCards.length < 4) return false;
    
    // Filtra estrictamente los órganos que existen y que NO tienen virus activos
    const healthyOrgans = bodyCards.filter(organ => organ && (!organ.viruses || organ.viruses.length === 0));
    
    // Filtra nombres válidos para evitar que un 'undefined' cuente como punto
    const validNames = healthyOrgans.map(organ => organ.name).filter(name => name !== undefined && name !== null);
    
    const uniqueHealthyNames = new Set(validNames);
    
    // Si hay 4 o más órganos termina el juego
    return uniqueHealthyNames.size >= 4;
}