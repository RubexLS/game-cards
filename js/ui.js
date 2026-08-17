import { gameState, HAND_KEY, BODY_KEY, MAP_ROL, getStatus, GAME_ID, resetDrawPhase } from './state.js';
import { firebaseMock, passTurn } from './firebaseMock.js';
import { Cards, drawCard, renderBody } from './game.js';

// Elementos del DOM
export const handTemp = document.getElementById('player-hand');
const deckElement = document.getElementById('deck');
const deckCountElement = document.getElementById('deck-count');
const exileSlot = document.getElementById('exile-slot');

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

    gameState.deck = gameData.deck || [];
    gameState.status = gameData.turn;
    gameState.exileZone = gameData.exileZone || [];

    // control
    const lobby = gameData.unavailablePlayers || [];
    gameState.activePlayers = lobby.map(idButton => MAP_ROL[idButton].mano);

    ['Orange', 'Blue', 'Red', 'Yellow', 'Green'].forEach(color => {
        gameState[`player${color}`] = gameData[`player${color}`] || [];
        gameState[`body${color}`] = gameData[`body${color}`] || [];
    });

    const currentTurn = gameData.turn;

    if (getStatus() && lastTurnScored !== currentTurn) {
        passTurn(); // Solo se desbloquea el botón cuando es una ronda 100% nueva para ti
        resetDrawPhase(); 
    } else if (!getStatus()) {
        resetDrawPhase(); 
    }

    lastTurnScored = currentTurn;

    renderHand();
    renderBoard();
    renderBody();
}

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    handTemp.innerHTML = '';
    const myCards = gameState[HAND_KEY] || [];

    import('./game.js').then(m => {
        m.renderHandPlayer(myCards, handTemp);
    });

    if (getStatus()) {
        handTemp.classList.remove('disabled');
    } else {
        handTemp.classList.add('disabled');
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

// Renderizado del cuerpo del jugador y sus rivales
export function renderBodyBoard (bodyKey, slotsHTML) {
    if (!slotsHTML) return;

    Object.values(slotsHTML).forEach(slot => { if (slot) slot.innerHTML = ''; });

    const bodyCards = gameState[bodyKey] || [];
    bodyCards.forEach(card => {
        let organSlot;
        const organDiv = document.createElement('div');

        switch (card.name) {
            case 'brain': organDiv.className = 'organ brain-card'; organSlot = slotsHTML.brain; break;
            case 'heart': organDiv.className = 'organ heart-card'; organSlot = slotsHTML.heart; break;
            case 'stomach': organDiv.className = 'organ stomach-card'; organSlot = slotsHTML.stomach; break;
            case 'bone': organDiv.className = 'organ bone-card'; organSlot = slotsHTML.bone; break;
            default: organDiv.className = 'organ nervous-card'; organSlot = slotsHTML.nervous; break;
        }

        if (organSlot) {
            organDiv.style.backgroundImage = `url('${card.cardPhoto}')`;
            organDiv.style.backgroundSize = '100% 100%';
            organDiv.style.width = '100%';
            organDiv.style.height = '100%';
            
            // Atributos de metadatos listos para cuando lances virus
            organDiv.dataset.propietario = bodyKey; 
            organDiv.dataset.organo = card.name;

            // inyeccion de contenedor de iconos (virus, vacunas, inmunidad)
            const tokensContainer = document.createElement('div');
            tokensContainer.className = 'organ-tokens';

            // asegurar la existencia de los arrays de medicinas y virus
            const currentViruses = card.viruses || [];
            const currentMedicines = card.medicines || [];

            // Renderizar el icono de Virus
            currentViruses.forEach(virus => {
                const virusToken = document.createElement('div');
                virusToken.className = `token virus-token ${virus.color}`;
                tokensContainer.appendChild(virusToken);
            });

            // Renderiza el icono de Medicina
            currentMedicines.forEach(medicine => {
                const medToken = document.createElement('div');
                medToken.className = `token medicine-token ${medicine.color}`;
                tokensContainer.appendChild(medToken);
            });

            // Si tiene 2 vacunas o más, añade la clase de inmunidad al órgano
            if (currentMedicines.length >= 2) {
                organDiv.classList.add('is-immune');
            }

            // Metemos los iconos dentro del órgano antes de agregarlo al slot
            organDiv.appendChild(tokensContainer);
            organSlot.appendChild(organDiv);
        }
    });

    Object.values(slotsHTML).forEach(slot => {
        if (slot && slot.children.length === 0) {
            slot.innerText = 'Vacío';
        }
    });
}

// Detecta clicks en el mazo
deckElement.addEventListener('click', drawCard);

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