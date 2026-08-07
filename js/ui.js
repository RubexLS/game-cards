import { Cards, renderHandPlayer, renderBody } from './game.js';
import { firebaseMock, iniciarNuevoTurno } from './firebaseMock.js'; // Conectado a tu nuevo Firebase real

const GAME_ID = 'game_001'; // ID de la sala de juego

// DEFINIR ROL LOCAL: Cambiar a 'playerBlue' en la computadora del otro jugador
const MI_ROL = 'playerOrange'; 
const RIVAL_ROL = (MI_ROL === 'playerOrange') ? 'playerBlue' : 'playerOrange';

// Los 'let' planos son cambiados por funciones que leen de la base de datos simulada
// Centralizamos todo en un único objeto exportado para mantener la referencia viva
export let estadoJuego = {
    playerOrange: [],
    playerBlue: [],
    exileZone: [],
    bodyZone: [],
    deck: [],
    status: true
};

// Shorthands para mantener compatibilidad con tus eventos visuales internos
export function getStatus() { 
    // Es mi turno si el estado de la DB coincide con mi rol
    if (MI_ROL === 'playerOrange') return estadoJuego.status === true;
    if (MI_ROL === 'playerBlue') return estadoJuego.status === false;
}

export async function iniciarJuego() {    
    if (MI_ROL == 'playerOrange'){
        Cards.buildDeck();
        Cards.mingle();
        
        let newDeck = [...Cards.deck];
        let newHandPlayer = [];
        let newHandOponent = [];

        for(let i=0; i<3; i++){    
            newHandPlayer.push(newDeck.pop());
            newHandOponent.push(newDeck.pop());
        }

        // (Sincronización del estado) en el "firebase"
        await firebaseMock.updateGame(GAME_ID, {
            deck: newDeck,
            playerOrange: newHandPlayer,
            playerBlue: newHandOponent,
            turn: true,
            exileZone: [],
            bodyZone: []
        });
    }
}

// Trae los datos del JSON/Firebase y actualiza las variables locales
export async function syncDataBase(gameData) {
    if (gameData) {
        estadoJuego.deck = gameData.deck || [];
        estadoJuego.playerOrange = gameData.playerOrange || [];
        estadoJuego.playerBlue = gameData.playerBlue || [];
        estadoJuego.status = gameData.turn;
        estadoJuego.exileZone = gameData.exileZone || [];
        estadoJuego.bodyZone = gameData.bodyZone || [];
        
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
    oponentHandElement.innerHTML = '';

    const misCartas = estadoJuego[MI_ROL];
    const cartasRival = estadoJuego[RIVAL_ROL];

    renderHandPlayer(misCartas, handTemp);
    renderHandPlayer(cartasRival, oponentHandElement);

    const esMiTurno = getStatus();
    if (esMiTurno) {
        handTemp.classList.remove('disabled');
        oponentHandElement.classList.add('disabled');
        buttonElement.disabled = false;
        buttonElement.innerText = "Finalizar Turno";
    } else {
        handTemp.classList.add('disabled');
        oponentHandElement.classList.remove('disabled');
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

    const miMano = estadoJuego[MI_ROL];

    if (miMano.length >= 3) {
        alert("Tu mano ya está llena (máximo 3 cartas).");
        return;
    }

    // Modificacion de los datos temporalmente
    const nextCard = estadoJuego.deck.pop();
    miMano.push(nextCard);

    await firebaseMock.updateGame(GAME_ID, {
        deck: estadoJuego.deck,
        [MI_ROL]: miMano
    });
}

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', async () => {
    if (!getStatus()) return; // Por seguridad

    await firebaseMock.updateGame(GAME_ID, {
        turn: !estadoJuego.status // Cambia el boolean en la nube
    });
});