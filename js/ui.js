import { Cards, renderHandPlayer } from './game.js';
import { firebaseMock } from './firebaseMock.js'; // simulador

const GAME_ID = 'game_001'; // ID de la sala de juego

// Los 'let' planos son cambiados por funciones que leen de la base de datos simulada
// Centralizamos todo en un único objeto exportado para mantener la referencia viva
export let estadoJuego = {
    playerHand: [],
    oponentHand: [],
    exileZone: [],
    bodyZone: [],
    deck: [],
    status: true
};

// Shorthands para mantener compatibilidad con tus eventos visuales internos
export function getStatus() { return estadoJuego.status; } //------------------------------

export async function iniciarJuego() {
    // 1. Forzar limpieza del localStorage viejo
    localStorage.removeItem('firebase_mock_juego_cartas');
    
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
        playerHand: newHandPlayer,
        oponentHand: newHandOponent,
        turn: true,
        exileZone: [],
        bodyZone: []
    });

    await syncDataBase();

    renderHand('firstTurn')
    
    console.log("¡Partida inicializada en Firebase Local con éxito!");
}

// Trae los datos del JSON/Firebase y actualiza las variables locales
export async function syncDataBase() {
    const gameData = await firebaseMock.getGame(GAME_ID);
    
    if (gameData) {
        estadoJuego.deck = gameData.deck || [];
        estadoJuego.playerHand = gameData.playerHand || [];
        estadoJuego.oponentHand = gameData.oponentHand || [];
        estadoJuego.status = gameData.turn;
        estadoJuego.exileZone = gameData.exileZone || [];
        estadoJuego.bodyZone = gameData.bodyZone || [];

        renderHand();
        renderBoard();
    }
}

// Elementos del DOM
const deckElement = document.getElementById('deck');
const deckCountElement = document.getElementById('deck-count');
export const playerHandElement = document.getElementById('player-hand');
export const oponentHandElement = document.getElementById('oponent-hand');
const exileSlot = document.getElementById('exile-slot');
const buttonElement = document.getElementById('turn');

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    // deckCountElement.innerText = deck.length;
    if (keyword === 'firstTurn') {
        playerHandElement.classList.remove('disabled');
        oponentHandElement.classList.remove('disabled');
        
        renderHandPlayer(estadoJuego.playerHand, playerHandElement);
        renderHandPlayer(estadoJuego.oponentHand, oponentHandElement);

        oponentHandElement.classList.add('disabled');
    }else if(estadoJuego.status){
        playerHandElement.classList.remove('disabled');
        renderHandPlayer(estadoJuego.playerHand, playerHandElement);
        oponentHandElement.classList.add('disabled');
    }else if(!estadoJuego.status){
        oponentHandElement.classList.remove('disabled');
        renderHandPlayer(estadoJuego.oponentHand, oponentHandElement);
        playerHandElement.classList.add('disabled');
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
    let currentPLayer;

    if (estadoJuego.deck.length === 0) {
        alert("¡No quedan cartas en el mazo!");
        return;
    }

    if(estadoJuego.status){
        currentPLayer = estadoJuego.playerHand;
    }else{
        currentPLayer = estadoJuego.oponentHand;
    }
    
    if (currentPLayer.length >= 3) {
        alert("Tu mano ya está llena (máximo 3 cartas). ¡Debes desterrar una primero!");
        return;
    }

    // Modificacion de los datos temporalmente
    const nextCard = estadoJuego.deck.pop();
    currentPLayer.push(nextCard);

    await firebaseMock.updateGame(GAME_ID, {
        deck: estadoJuego.deck,
        playerHand: estadoJuego.playerHand,
        oponentHand: estadoJuego.oponentHand
    });

    await syncDataBase();
}

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', async () => {
    await firebaseMock.updateGame(GAME_ID, {
        turn: !estadoJuego.status
    });

    await syncDataBase();
});