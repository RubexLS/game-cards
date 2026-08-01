// Base de datos de ejemplo para el mazo
// const cardPool = ["🔥 A", "💧 B", "🌿 C", "⚡ D", "💀 E", "☀️ F", "👁️ G", "❄️ H", "🌪️ I", "⛰️ J"];
import Cards, { deckGame } from './game.js';
Cards.buildDeck();
Cards.mingle();

// const cardPool = deck;
// Estado del juego
let deck = [...deckGame]; // Copia del mazo para el juego actual
let playerHand = [];
let oponentHand = [];
let exileZone = [];
let discardZone = []; // Listo para uso futuro si agregas más mecánicas

let status = true;

// Elementos del DOM
const deckElement = document.getElementById('deck');
const deckCountElement = document.getElementById('deck-count');
const playerHandElement = document.getElementById('player-hand');
const oponentHandElement = document.getElementById('oponent-hand');
const exileSlot = document.getElementById('exile-slot');
const buttonElement = document.getElementById('turn');

// Función para actualizar la interfaz visual de la mano
function renderHand() {
    // let status = false;
    if(status){
        playerHandElement.innerHTML = '';
        playerHand.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            switch (index) {
                case 0:
                    cardDiv.className = 'card left-card';
                    cardDiv.innerText = card;
                    break;
                case 1:
                    cardDiv.className = 'card medium-card';
                    cardDiv.innerText = card;
                    break;
                case 2:
                    cardDiv.className = 'card right-card';
                    cardDiv.innerText = card;
                    break;
            }
            // Al hacer clic en una carta de la mano, se destierra
            cardDiv.addEventListener('click', () => exileCard(index));
            playerHandElement.appendChild(cardDiv);
        });
    }else{
        oponentHandElement.innerHTML = '';
        oponentHand.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            switch (index) {
                case 0:
                    cardDiv.className = 'card left-card';
                    cardDiv.innerText = card;
                    break;
                case 1:
                    cardDiv.className = 'card medium-card';
                    cardDiv.innerText = card;
                    break;
                case 2:
                    cardDiv.className = 'card right-card';
                    cardDiv.innerText = card;
                    break;
            }
            // Al hacer clic en una carta de la mano, se destierra
            cardDiv.addEventListener('click', () => exileCard(index));
            oponentHandElement.appendChild(cardDiv);
        });
    }

}

// Función para actualizar los contadores y zonas de la mesa
function renderBoard() {
    deckCountElement.innerText = deck.length;
    
    if (deck.length === 0) {
        deckElement.style.backgroundColor = '#7f8c8d';
        deckElement.innerText = 'Vacío';
    }

    if (exileZone.length > 0) {
        exileSlot.className = 'card';
        exileSlot.innerText = exileZone[exileZone.length - 1];
    } else {
        exileSlot.className = 'card-slot';
        exileSlot.innerText = 'Vacío';
    }
}

// Lógica para robar una carta
function drawCard() {
    if(status){
        if (deck.length === 0) {
            alert("¡No quedan cartas en el mazo!");
            return;
        }
        if (playerHand.length >= 3) {
            alert("Tu mano ya está llena (máximo 3 cartas). ¡Debes desterrar una primero!");
            return;
        }

        const nextCard = deck.pop();
        playerHand.push(nextCard);
    }else{
        if (deck.length === 0) {
            alert("¡No quedan cartas en el mazo!");
            return;
        }
        if (oponentHand.length >= 3) {
            alert("Tu mano ya está llena (máximo 3 cartas). ¡Debes desterrar una primero!");
            return;
        }

        const nextCard = deck.pop();
        oponentHand.push(nextCard);
    }

    renderHand();
    renderBoard();
}

// Lógica para desterrar una carta de la mano
function exileCard(cardIndex) {
    if(status){
        const excludedCard = playerHand.splice(cardIndex, 1)[0];
        exileZone.push(excludedCard);

        renderHand();
        renderBoard();
    }else{
        const excludedCard = oponentHand.splice(cardIndex, 1)[0];
        exileZone.push(excludedCard);

        renderHand();
        renderBoard();
    }
}

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', () => {
    status = !status;
});

// Inicializar el juego visualmente
renderBoard();