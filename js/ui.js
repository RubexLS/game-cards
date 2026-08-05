import { Cards, renderHandPlayer } from './game.js';
import { firebaseMock } from './firebaseMock.js'; // Importamos el simulador

const GAME_ID = 'game_001'; // ID de la sala de juego

// Reemplazamos los 'let' planos por funciones que leen de nuestra base de datos simulada
// export let playerHand = [];
// export let oponentHand = [];
// export let exileZone = [];
// export let bodyZone = [];
// let deck = []; 
// export let status = true;


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
export function getStatus() { return estadoJuego.status; }

export async function iniciarJuego() {
    // 1. Forzar limpieza del localStorage viejo para evitar estados corruptos de pruebas anteriores
    localStorage.removeItem('firebase_mock_juego_cartas');
    
    // 1. El "Servidor" construye y mezcla el mazo
    Cards.buildDeck();
    Cards.mingle();
    let newDeck = [...Cards.deck]; // Asignamos las cartas al mazo actual

    let newHandPlayer = [];
    let newHandOponent = [];

    // 2. Repartir cartas iniciales
    for(let i=0; i<3; i++){    
        newHandPlayer.push(newDeck.pop());
        newHandOponent.push(newDeck.pop());
    }

    // 3. GUARDAR EN EL FALSO FIREBASE (Sincronización del estado)
    await firebaseMock.updateGame(GAME_ID, {
        deck: newDeck,
        playerHand: newHandPlayer,
        oponentHand: newHandOponent,
        turn: true,
        exileZone: [],
        bodyZone: []
    });


    // 4. Leer de la base de datos para renderizar visualmente
    await syncDataBase();
    
    console.log("¡Partida inicializada en Firebase Local con éxito!");

    // // 2. Repartir la mano inicial automáticamente (3 cartas a cada uno)
    // let keyword = 'firstTurn';
    // for(let i=0; i<3; i++){    
    //     const nextCardPlayer = deck.pop();
    //     playerHand.push(nextCardPlayer);
    //     const nextCardOponent = deck.pop();
    //     oponentHand.push(nextCardOponent);
    // }

    // // 3. Dibujar el tablero por primera vez
    // renderHand(keyword);
    // renderBoard();
    
    // console.log("¡Partida inicializada con éxito!");
}

// export let playerHand = [];
// export let oponentHand = [];
// export let exileZone = [];
// let discardZone = []; // Listo para uso futuro si agregas más mecánicas

// export let status = true;

// NUEVA FUNCIÓN: Trae los datos del JSON/Firebase y actualiza las variables locales
export async function syncDataBase() {
    const gameData = await firebaseMock.getGame(GAME_ID);
    
    if (gameData) {
        estadoJuego.deck = gameData.deck || [];
        estadoJuego.playerHand = gameData.playerHand || [];
        estadoJuego.oponentHand = gameData.oponentHand || [];
        estadoJuego.status = gameData.turn;
        estadoJuego.exileZone = gameData.exileZone || [];
        estadoJuego.bodyZone = gameData.bodyZone || [];

        // Dibujar el tablero con los datos recién bajados de la "nube"
        renderHand('firstTurn'); // O la lógica de turnos que aplique
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
// const buttonStartGame = document.getElementById('startGame');

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    // deckCountElement.innerText = deck.length;
    if (keyword === 'firstTurn') {
        playerHandElement.classList.remove('disabled');
        oponentHandElement.classList.remove('disabled');
        
        renderHandPlayer(playerHand, playerHandElement);
        renderHandPlayer(oponentHand, oponentHandElement);

        oponentHandElement.classList.add('disabled');
    }else if(estadoJuego.status){
        playerHandElement.classList.remove('disabled');
        renderHandPlayer(playerHand, playerHandElement);
        oponentHandElement.classList.add('disabled');
    }else if(!estadoJuego.status){
        oponentHandElement.classList.remove('disabled');
        renderHandPlayer(oponentHand, oponentHandElement);
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
        const ultimaCarta = estadoJuego.exileZone[estadoJuego.exileZone.length - 1];
        exileSlot.className = 'card';
        exileSlot.innerText = '';

        // Asumimos que guardaste el objeto completo o su propiedad cardPhoto
        // Si en exileZone guardaste solo el nombre, necesitaremos buscar su foto. 
        // Si guardaste el objeto completo (ej: {name: 'bone', cardPhoto: '/assets/bone.png'}), usa esto:
        // const rutaFoto = ultimaCartaExiliada.cardPhoto || ultimaCartaExiliada;

        // exileSlot.innerText = exileZone[exileZone.length - 1]; // nombres de las cartas
        exileSlot.style.backgroundImage = `url('${ultimaCarta}')`;
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

    if(status){
        currentPLayer = playerHand;
    }else{
        currentPLayer = oponentHand;
    }
    
    if (currentPLayer.length >= 3) {
        alert("Tu mano ya está llena (máximo 3 cartas). ¡Debes desterrar una primero!");
        return;
    }

    // Modificamos los datos locales temporalmente
    const nextCard = estadoJuego.deck.pop();
    currentPLayer.push(nextCard);

    // SUBIR CAMBIOS AL FALSO FIREBASE
    await firebaseMock.updateGame(GAME_ID, {
        deck: estadoJuego.deck,
        playerHand: estadoJuego.playerHand,
        oponentHand: estadoJuego.oponentHand
    });

    // Volver a sincronizar y pintar la pantalla
    await syncDataBase();
    // renderHand();
    // renderBoard();
}

// Evento para hacer clic en el mazo
deckElement.addEventListener('click', drawCard);

// cambio de turno
buttonElement.addEventListener('click', async () => {
    // Invertimos el turno en la base de datos simulada
    await firebaseMock.updateGame(GAME_ID, {
        turn: !estadoJuego.status
    });

    // Sincronizamos pantallas
    await syncDataBase();
});