import { Cards, renderHandPlayer, renderBody } from './game.js';
import { firebaseMock, passTurn } from './firebaseMock.js';

const GAME_ID = 'game_001'; // ID de la sala de juego

// Estado global del jugador, mano y cuerpo
export let MI_ROL = null;
export let HAND_KEY = null;
export let BODY_KEY = null;

const MAP_ROL = {
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

// único objeto exportado para mantener la referencia online
export let gameState = {
    deck: [],
    exileZone: [],
    status: true,
    // Manos
    playerOrange: [],
    playerBlue: [],
    playerRed: [],
    playerYellow: [],
    playerGreen: [],
    // Cuerpos
    bodyOrange: [],
    bodyBlue: [],
    bodyRed: [],
    bodyYellow: [],
    bodyGreen: []
};

// Shorthand para mantener compatibilidad con cada uno de los eventos del juego
export function getStatus() { 
    // Es tu turno si la clave de tu mano local coincide exactamente con el turno activo en Firebase
    return gameState.status === HAND_KEY;
}

export async function startGame() {    
    const gameData = await firebaseMock.getGame(GAME_ID);
    if (!gameData || !gameData.unavailablePlayers || gameData.unavailablePlayers.length === 0) {
        alert("No hay suficientes jugadores en la sala para iniciar.");
        return;
    }

    // Obtener los IDs de los botones (avatars) seleccionados
    const playersOnline = gameData.unavailablePlayers;
    const playerHost = playersOnline[0]; 
    const handKeyHost = MAP_ROL[playerHost].mano;

    if (HAND_KEY == handKeyHost){

        Cards.buildDeck();
        Cards.mingle();
        let newDeck = [...Cards.deck];

        let dataUpdate = {
            state: "en_progreso",
            turn: handKeyHost,
            exileZone: [],
            discardZone: []
        };

        // reparte cartas a todos los avatars seleccionados
        playersOnline.forEach(idButton => {
            const key = MAP_ROL[idButton]; // Traduce 'playerO' a 'playerOrange' y 'bodyOrange'
            
            let handPlayer = [];
            for (let i = 0; i < 3; i++) {
                if (newDeck.length > 0) {
                    handPlayer.push(newDeck.pop());
                }
            }

            // Creamos las propiedades en Firebase al vuelo solo para este jugador
            dataUpdate[key.mano] = handPlayer;
            dataUpdate[key.cuerpo] = [];
        });


        // actualiza el estado del mazo
        dataUpdate.deck = newDeck;
        await firebaseMock.updateGame(GAME_ID, dataUpdate);
    }else{
        alert("Solo el creador de la sala (el primer jugador en unirse) puede iniciar la partida. Esperando a que inicie...");
    }
}

// Trae los datos de Firebase y actualiza las variables locales
export async function syncDataBase(gameData) {
    if (gameData) {
        gameState.deck = gameData.deck || [];
        gameState.status = gameData.turn;
        gameState.exileZone = gameData.exileZone || [];

        // control
        const lobby = gameData.unavailablePlayers || [];
        gameState.activePlayers = lobby.map(idButton => MAP_ROL[idButton].mano);

        gameState.playerOrange = gameData.playerOrange || [];
        gameState.playerBlue = gameData.playerBlue || [];
        gameState.playerRed = gameData.playerRed || [];
        gameState.playerYellow = gameData.playerYellow || [];
        gameState.playerGreen = gameData.playerGreen || [];

        gameState.bodyOrange = gameData.bodyOrange || [];
        gameState.bodyBlue = gameData.bodyBlue || [];
        gameState.bodyRed = gameData.bodyRed || [];
        gameState.bodyYellow = gameData.bodyYellow || [];
        gameState.bodyGreen = gameData.bodyGreen || [];
        
        if (getStatus()) {
            passTurn();
        }

        renderHand();
        renderBoard();
        renderBody();
    }
}

// Elementos del DOM
const deckElement = document.getElementById('deck');
const deckCountElement = document.getElementById('deck-count');
export let handTemp = document.getElementById('player-hand');
const exileSlot = document.getElementById('exile-slot');
const buttonElement = document.getElementById('turn');

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    handTemp.innerHTML = '';

    const myCards = gameState[HAND_KEY] || [];

    renderHandPlayer(myCards, handTemp);

    if (getStatus()) {
        handTemp.classList.remove('disabled');
        buttonElement.disabled = false;
        buttonElement.innerText = "Finalizar Turno";
    } else {
        handTemp.classList.add('disabled');
        buttonElement.disabled = true;
        buttonElement.innerText = "Turno del Rival";
    }
}

// renderizado y actualizado de los slots del tablero
export function renderBoard(cardImage) {
    deckCountElement.innerText = gameState.deck.length;
    
    if (gameState.deck.length === 0) {
        deckElement.style.backgroundColor = '#7f8c8d';
        deckElement.innerText = 'Vacío';
    }

    if (gameState.exileZone.length > 0) {
        const lastCard = gameState.exileZone[gameState.exileZone.length - 1];
        exileSlot.className = 'card';
        exileSlot.innerText = '';
        // exileSlot.innerText = exileZone[exileZone.length - 1]; // nombres de las cartas
        exileSlot.style.backgroundImage = `url('${lastCard}')`;
        exileSlot.style.backgroundSize = "cover";
    } else {
        exileSlot.className = 'card-slot';
        exileSlot.innerText = 'Vacío';
    }
}

// Lógica para el robo de cartas
async function drawCard() {
    // Bloquear si no es mi turno
    if (!getStatus()) {
        alert("No es tu turno para robar.");
        return;
    }

    if (gameState.deck.length === 0) {
        alert("¡No quedan cartas en el mazo!");
        return;
    }

    const hand = gameState[HAND_KEY];

    if (hand.length >= 3) {
        alert("Tu mano ya está llena (máximo 3 cartas).");
        return;
    }

    // Modificacion de los datos temporalmente
    const nextCard = gameState.deck.pop();
    hand.push(nextCard);

    await firebaseMock.updateGame(GAME_ID, {
        deck: gameState.deck,
        [HAND_KEY]: hand
    });
}

// Detecta clicks en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', async () => {
    if (!getStatus()) return; // Por seguridad

    const orderPlayers = ['playerOrange', 'playerBlue', 'playerRed', 'playerYellow', 'playerGreen'];

    const playersInGame = orderPlayers.filter(player => gameState.activePlayers.includes(player));
    
    // índice del jugador actual
    const currentIndex = playersInGame.indexOf(HAND_KEY);
    
    // Encuentra el siguiente índice (vuelve a 0 cuando llega al final del array)
    const nextIndex = (currentIndex + 1) % playersInGame.length;
    const nextPlayer = playersInGame[nextIndex];

    await firebaseMock.updateGame(GAME_ID, {
        turn: nextPlayer 
    });
});

// solo para online
// export function rolRecovery() {
//     const rolSaved = localStorage.getItem(`rol_${GAME_ID}`);
//     if (rolSaved && MAP_ROL[rolSaved]) {
//         MI_ROL = rolSaved;
//         HAND_KEY = MAP_ROL[rolSaved].mano;
//         BODY_KEY = MAP_ROL[rolSaved].cuerpo;
//         console.log(`🔄 Rol recuperado automáticamente: ${HAND_KEY}`);
//         return rolSaved;
//     }
//     return null;
// }