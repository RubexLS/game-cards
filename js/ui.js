import { Cards, renderHandPlayer } from './game.js';

export function iniciarJuego() {
    // 1. Construir y mezclar el mazo al arrancar
    Cards.buildDeck();
    Cards.mingle();
    deck = [...Cards.deck]; // Asignamos las cartas al mazo actual

    // 2. Repartir la mano inicial automáticamente (3 cartas a cada uno)
    let keyword = 'firstTurn';
    for(let i=0; i<3; i++){    
        const nextCardPlayer = deck.pop();
        playerHand.push(nextCardPlayer);
        const nextCardOponent = deck.pop();
        oponentHand.push(nextCardOponent);
    }

    // 3. Dibujar el tablero por primera vez
    renderHand(keyword);
    renderBoard();
    
    console.log("¡Partida inicializada con éxito!");
}

export let playerHand = [];
export let oponentHand = [];
export let exileZone = [];
let discardZone = []; // Listo para uso futuro si agregas más mecánicas

export let status = true;

// Elementos del DOM
const deckElement = document.getElementById('deck');
const deckCountElement = document.getElementById('deck-count');
export const playerHandElement = document.getElementById('player-hand');
export const oponentHandElement = document.getElementById('oponent-hand');
const exileSlot = document.getElementById('exile-slot');
const buttonElement = document.getElementById('turn');
const buttonStartGame = document.getElementById('startGame');

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    if (keyword === 'firstTurn') {
        playerHandElement.classList.remove('disabled');
        oponentHandElement.classList.remove('disabled');
        
        renderHandPlayer(playerHand, playerHandElement);
        renderHandPlayer(oponentHand, oponentHandElement);

        oponentHandElement.classList.add('disabled');
    }else if(status){
        playerHandElement.classList.remove('disabled');
        renderHandPlayer(playerHand, playerHandElement);
        oponentHandElement.classList.add('disabled');
    }else if(!status){
        oponentHandElement.classList.remove('disabled');
        renderHandPlayer(oponentHand, oponentHandElement);
        playerHandElement.classList.add('disabled');
    }
}

// Función para actualizar los contadores y zonas de la mesa
export function renderBoard(cardImage) {
    deckCountElement.innerText = deck.length;
    
    if (deck.length === 0) {
        deckElement.style.backgroundColor = '#7f8c8d';
        deckElement.innerText = 'Vacío';
    }

    if (exileZone.length > 0) {
        exileSlot.className = 'card';
        exileSlot.innerText = '';
        // exileSlot.innerText = exileZone[exileZone.length - 1]; // nombres de las cartas
        exileSlot.style.backgroundImage = cardImage;
        exileSlot.style.backgroundSize = "cover";
    } else {
        exileSlot.className = 'card-slot';
        exileSlot.innerText = 'Vacío';
    }
}

// Lógica para robar una carta
function drawCard() {
    let currentPLayer;

    if (deck.length === 0) {
        alert("¡No quedan cartas en el mazo!");
        return;
    }

    if(status){
        currentPLayer = playerHand;
    }else{
        currentPLayer = oponentHand;
    }
    
    if (currentPLayer.length >= 3) {
        alert("Tu mano ya está llena (máximo 3 cartas). ¡Debes desterrar una primero!");
        return;
    }

    const nextCard = deck.pop();
    currentPLayer.push(nextCard);

    renderHand();
    renderBoard();
}

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', () => {
    status = !status;
    renderHand();
});