import { Cards, renderHandPlayer, renderBody } from './game.js';
import { firebaseMock, iniciarNuevoTurno } from './firebaseMock.js'; // Conectado a tu nuevo Firebase real

const GAME_ID = 'game_001'; // ID de la sala de juego

// ESTADO GLOBAL DINÁMICO DE ROLES (Se llenan al elegir personaje)
export let MI_ROL = null;
export let HAND_KEY = null;
export let BODY_KEY = null;

const MAPA_ROLES = {
    'playerO': { mano: 'playerOrange', cuerpo: 'bodyOrange' },
    'playerB': { mano: 'playerBlue',   cuerpo: 'bodyBlue' },
    'playerR': { mano: 'playerRed',    cuerpo: 'bodyRed' },
    'playerY': { mano: 'playerYellow', cuerpo: 'bodyYellow' },
    'playerG': { mano: 'playerGreen',  cuerpo: 'bodyGreen' }
};

// Función para registrar qué jugador está sentado en esta computadora
export function assignPlayer(idButton) {
    MI_ROL = idButton;
    HAND_KEY = MAPA_ROLES[idButton].mano;
    BODY_KEY = MAPA_ROLES[idButton].cuerpo;
    
    // localStorage.setItem(`rol_${GAME_ID}`, idButton); // solo para online
}

// Los 'let' planos son cambiados por funciones que leen de la base de datos simulada
// Centralizamos todo en un único objeto exportado para mantener la referencia viva
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

// Shorthands para mantener compatibilidad con tus eventos visuales internos
export function getStatus() { 
    // Es tu turno si la clave de tu mano local coincide exactamente con el turno activo en Firebase
    return gameState.status === HAND_KEY;
}

export async function iniciarJuego() {    
    const gameData = await firebaseMock.getGame(GAME_ID);
    if (!gameData || !gameData.unavailablePlayers || gameData.unavailablePlayers.length === 0) {
        alert("No hay suficientes jugadores en la sala para iniciar.");
        return;
    }

    // Obtener los IDs de los botones seleccionados (ej: ['playerO', 'playerB'])
    const rolesConectados = gameData.unavailablePlayers;
    const idBotonHost = rolesConectados[0]; 
    const manoClaveHost = MAPA_ROLES[idBotonHost].mano;

    if (HAND_KEY == manoClaveHost){

        Cards.buildDeck();
        Cards.mingle();
        let newDeck = [...Cards.deck];

        let dataUpdate = {
            state: "en_progreso",
            turn: manoClaveHost,
            exileZone: [],
            discardZone: []
        };

        // 4. REPARTO DINÁMICO: Reparte 3 cartas SOLO a los que se unieron
        rolesConectados.forEach(idButton => {
            const claves = MAPA_ROLES[idButton]; // Traduce 'playerO' a 'playerOrange' y 'bodyOrange'
            
            let manoJugador = [];
            for (let i = 0; i < 3; i++) {
                if (newDeck.length > 0) {
                    manoJugador.push(newDeck.pop());
                }
            }

            // Creamos las propiedades en Firebase al vuelo solo para este jugador
            dataUpdate[claves.mano] = manoJugador;
            dataUpdate[claves.cuerpo] = [];
        });


        // 5. Guardar el estado del mazo remanente
        dataUpdate.deck = newDeck;

        // 6. Subir a Firebase (Si elegiste 2 jugadores, solo se restarán 6 cartas del mazo)
        await firebaseMock.updateGame(GAME_ID, dataUpdate);
    }else{
        alert("Solo el creador de la sala (el primer jugador en unirse) puede iniciar la partida. Esperando a que inicie...");
    }
}

// Trae los datos del JSON/Firebase y actualiza las variables locales
export async function syncDataBase(gameData) {
    if (gameData) {
        gameState.deck = gameData.deck || [];
        gameState.status = gameData.turn;
        gameState.exileZone = gameData.exileZone || [];

        // control
        const salaEspera = gameData.unavailablePlayers || [];
        gameState.jugadoresActivos = salaEspera.map(idBoton => MAPA_ROLES[idBoton].mano);

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
            iniciarNuevoTurno();
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
export let oponentHandElement = document.getElementById('oponent-hand');
const exileSlot = document.getElementById('exile-slot');
const buttonElement = document.getElementById('turn');

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    handTemp.innerHTML = '';
    // oponentHandElement.innerHTML = '';

    const misCartas = gameState[HAND_KEY] || [];
    // const cartasRival = gameState[RIVAL_ROL];

    renderHandPlayer(misCartas, handTemp);
    // renderHandPlayer(cartasRival, oponentHandElement);

    const esMiTurno = getStatus();
    if (esMiTurno) {
        handTemp.classList.remove('disabled');
        // oponentHandElement.classList.add('disabled');
        buttonElement.disabled = false;
        buttonElement.innerText = "Finalizar Turno";
    } else {
        handTemp.classList.add('disabled');
        // oponentHandElement.classList.remove('disabled');
        buttonElement.disabled = true;
        buttonElement.innerText = "Turno del Rival";
    }
}

// Función para actualizar los contadores y zonas de la mesa
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

// Lógica para robar una carta conectada al simulador
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

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', async () => {
    if (!getStatus()) return; // Por seguridad

    // Definimos el orden oficial de los turnos en el juego
    const ORDEN_TURNOS = ['playerOrange', 'playerBlue', 'playerRed', 'playerYellow', 'playerGreen'];

    const jugadoresEnPartida = ORDEN_TURNOS.filter(player => gameState.jugadoresActivos.includes(player));
    
    // Buscamos el índice del jugador actual
    const indiceActual = jugadoresEnPartida.indexOf(HAND_KEY);
    
    // Calculamos el siguiente índice (vuelve a 0 cuando llega al final del array)
    const siguienteIndice = (indiceActual + 1) % jugadoresEnPartida.length;
    const siguienteJugador = jugadoresEnPartida[siguienteIndice];

    // Actualizamos el string del turno en la nube
    await firebaseMock.updateGame(GAME_ID, {
        turn: siguienteJugador 
    });
});

// solo para online
// export function recuperarRolGuardado() {
//     const rolGuardado = localStorage.getItem(`rol_${GAME_ID}`);
//     if (rolGuardado && MAPA_ROLES[rolGuardado]) {
//         MI_ROL = rolGuardado;
//         HAND_KEY = MAPA_ROLES[rolGuardado].mano;
//         BODY_KEY = MAPA_ROLES[rolGuardado].cuerpo;
//         console.log(`🔄 Rol recuperado automáticamente: ${HAND_KEY}`);
//         return rolGuardado;
//     }
//     return null;
// }