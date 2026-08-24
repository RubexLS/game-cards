import { gameState, HAND_KEY, MAP_ROL, GAME_ID, resetDrawPhase, setGameState, passTurn } from './state.js';
import { firebaseMock } from './firebaseMock.js';
import { Cards } from './deck.js';
import { showVictoryBanner, hideVictoryBanner, freezeHandInterface, clearOptions } from './mainUI.js';
import { renderHand, renderBoard, renderBody } from './ui.js';

let lastTurnScored = null;

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
    if (!gameData) return;
    
    const updated = {
        ...gameState,
        deck: gameData.deck || [], 
        turn: gameData.turn, 
        exileZone: gameData.exileZone || [] 
    };

    // control
    const lobby = gameData.unavailablePlayers || [];
    updated.activePlayers = lobby.map(id => MAP_ROL[id].mano);
    ['Orange', 'Blue', 'Red', 'Yellow', 'Green'].forEach(c => {
        updated[`player${c}`] = gameData[`player${c}`] || [];
        updated[`body${c}`] = gameData[`body${c}`] || [];
    });

    setGameState(updated);

    const isMyTurn = gameData.turn === HAND_KEY;
    if (isMyTurn && lastTurnScored !== gameData.turn) { 
        passTurn();  // Solo se desbloquea el botón cuando es una ronda 100% nueva para ti
        resetDrawPhase(); 
    } else if (!isMyTurn) {
        resetDrawPhase(); 
    }
    
    if (gameData.state === "finalizado") {
        clearOptions(); 
        freezeHandInterface();
        showVictoryBanner(gameData.winner, lobby[0] && MAP_ROL[gameData.unavailablePlayers[0]].mano === HAND_KEY);
    } else {
        hideVictoryBanner();
    }

    lastTurnScored = gameData.turn;
    renderHand(); 
    renderBoard(); 
    renderBody();
}

// limpia Firebase por completo manteniendo los mismos jugadores de la sala
export async function resetWholeGame() {
    const gameData = await firebaseMock.getGame(GAME_ID);
    if (!gameData) return;

    let dataReset = { 
        state: "esperando", 
        turn: gameData.unavailablePlayers?.[0] ? MAP_ROL[gameData.unavailablePlayers[0]].mano : "playerOrange", 
        deck: [], 
        exileZone: [], 
        discardZone: [], 
        winner: null 
    };

    // Limpiamos las manos y cuerpos de todos los colores
    ['Orange', 'Blue', 'Red', 'Yellow', 'Green'].forEach(c => {
        dataReset[`player${c}`] = []; 
        dataReset[`body${c}`] = []; 
    });
    await firebaseMock.updateGame(GAME_ID, dataReset);
}
