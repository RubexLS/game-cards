import { Cards, renderHandPlayer, renderBody } from './game.js';
import { firebaseMock, iniciarNuevoTurno } from './firebaseMock.js'; // Conectado a tu nuevo Firebase real

const GAME_ID = 'game_001'; // ID de la sala de juego

// ESTADO GLOBAL DINÁMICO DE ROLES (Se llenan al elegir personaje)
export let MI_ROL = null;
export let MI_MANO_CLAVE = null;
export let MI_CUERPO_CLAVE = null;

const MAPA_ROLES = {
    'playerO': { mano: 'playerOrange', cuerpo: 'bodyOrange' },
    'playerB': { mano: 'playerBlue',   cuerpo: 'bodyBlue' },
    'playerR': { mano: 'playerRed',    cuerpo: 'bodyRed' },
    'playerY': { mano: 'playerYellow', cuerpo: 'bodyYellow' },
    'playerG': { mano: 'playerGreen',  cuerpo: 'bodyGreen' }
};

// Función para registrar qué jugador está sentado en esta computadora
export function asignarRolLocal(idBoton) {
    MI_ROL = idBoton;
    MI_MANO_CLAVE = MAPA_ROLES[idBoton].mano;
    MI_CUERPO_CLAVE = MAPA_ROLES[idBoton].cuerpo;
    console.log(`Rol local configurado: Mano -> ${MI_MANO_CLAVE}, Cuerpo -> ${MI_CUERPO_CLAVE}`);
}

// Los 'let' planos son cambiados por funciones que leen de la base de datos simulada
// Centralizamos todo en un único objeto exportado para mantener la referencia viva
export let estadoJuego = {
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
    return estadoJuego.status === MI_MANO_CLAVE;
}

export async function iniciarJuego() {    
    if (MI_MANO_CLAVE == 'playerOrange'){
        Cards.buildDeck();
        Cards.mingle();
        
        let newDeck = [...Cards.deck];
        let handOrange = [];
        let handBlue = [];
        let handRed = [];
        let handYellow = [];
        let handGreen = [];

        for(let i=0; i<3; i++){    
            handOrange.push(newDeck.pop());
            handBlue.push(newDeck.pop());
            handRed.push(newDeck.pop());
            handYellow.push(newDeck.pop());
            handGreen.push(newDeck.pop());
        }

        // (Sincronización del estado) en el "firebase"
        await firebaseMock.updateGame(GAME_ID, {
            state: "en_progreso", // <-- ¡PASO CLAVE! Esto avisa a todo Firebase que el juego inició
            deck: newDeck,
            turn: "playerOrange",
            exileZone: [],
            playerOrange: handOrange,
            playerBlue: handBlue,
            playerRed: handRed,
            playerYellow: handYellow,
            playerGreen: handGreen,
            bodyOrange: [],
            bodyBlue: [],
            bodyRed: [],
            bodyYellow: [],
            bodyGreen: []
        });
    }
}

// Trae los datos del JSON/Firebase y actualiza las variables locales
export async function syncDataBase(gameData) {
    if (gameData) {
        estadoJuego.deck = gameData.deck || [];
        estadoJuego.status = gameData.turn;
        estadoJuego.exileZone = gameData.exileZone || [];

        estadoJuego.playerOrange = gameData.playerOrange || [];
        estadoJuego.playerBlue = gameData.playerBlue || [];
        estadoJuego.playerRed = gameData.playerRed || [];
        estadoJuego.playerYellow = gameData.playerYellow || [];
        estadoJuego.playerGreen = gameData.playerGreen || [];

        estadoJuego.bodyOrange = gameData.bodyOrange || [];
        estadoJuego.bodyBlue = gameData.bodyBlue || [];
        estadoJuego.bodyRed = gameData.bodyRed || [];
        estadoJuego.bodyYellow = gameData.bodyYellow || [];
        estadoJuego.bodyGreen = gameData.bodyGreen || [];
        
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

    const misCartas = estadoJuego[MI_MANO_CLAVE] || [];
    // const cartasRival = estadoJuego[RIVAL_ROL];

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
    deckCountElement.innerText = estadoJuego.deck.length;
    
    if (estadoJuego.deck.length === 0) {
        deckElement.style.backgroundColor = '#7f8c8d';
        deckElement.innerText = 'Vacío';
    }

    if (estadoJuego.exileZone.length > 0) {
        const lastCard = estadoJuego.exileZone[estadoJuego.exileZone.length - 1];
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

    if (estadoJuego.deck.length === 0) {
        alert("¡No quedan cartas en el mazo!");
        return;
    }

    const miMano = estadoJuego[MI_MANO_CLAVE];

    if (miMano.length >= 3) {
        alert("Tu mano ya está llena (máximo 3 cartas).");
        return;
    }

    // Modificacion de los datos temporalmente
    const nextCard = estadoJuego.deck.pop();
    miMano.push(nextCard);

    await firebaseMock.updateGame(GAME_ID, {
        deck: estadoJuego.deck,
        [MI_MANO_CLAVE]: miMano
    });
}

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', async () => {
    if (!getStatus()) return; // Por seguridad

    // Definimos el orden oficial de los turnos en el juego
    const ORDEN_TURNOS = ['playerOrange', 'playerBlue', 'playerRed', 'playerYellow', 'playerGreen'];
    
    // Buscamos el índice del jugador actual
    const indiceActual = ORDEN_TURNOS.indexOf(MI_MANO_CLAVE);
    
    // Calculamos el siguiente índice (vuelve a 0 cuando llega al final del array)
    const siguienteIndice = (indiceActual + 1) % ORDEN_TURNOS.length;
    const siguienteJugador = ORDEN_TURNOS[siguienteIndice];

    // Actualizamos el string del turno en la nube
    await firebaseMock.updateGame(GAME_ID, {
        turn: siguienteJugador 
    });
});