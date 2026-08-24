import { firebaseMock } from './firebaseMock.js';
import { gameState, HAND_KEY, BODY_KEY, getStatus, GAME_ID, inDrawPhase, resetDrawPhase, startDrawPhase, checkBodyVictory, passTurn, recordUsage } from './state.js';
import { renderHandPlayer } from './ui.js'; 
import { handTemp, options } from './domElements.js';

export let activeTargetingCard = null;
export function setActiveTargetingCard(val) { 
    activeTargetingCard = val; 
}

export async function drawCard() {
    // Bloquear si no es mi turno
    if (!getStatus()) { alert("No es tu turno para robar."); return; }
    if (gameState.deck.length === 0) { alert("¡No quedan cartas!"); return; }

    // Clon de los arrays para no mutar el estado local de forma intermitente
    const tempDeck = [...gameState.deck];
    const tempHand = [...gameState[HAND_KEY]];
    if (tempHand.length >= 3) { alert("Tu mano está llena."); return; }
    
    // Al primer click en el mazo, se activa el candado: No más usar ni descartar
    if (!inDrawPhase) { startDrawPhase(); }

    // Modificacion de los datos temporalmente
    const nextCard = tempDeck.pop();
    tempHand.push(nextCard);

    // paquete de actualización para Firebase
    let updateData = {
        deck: tempDeck,
        [HAND_KEY]: tempHand
    };

    // secuencia de cambio de turno
    if (tempHand.length === 3) {
        resetDrawPhase(); // Limpia el candado local para su siguiente turno
        passTurn(); 
        
        const order = ['playerOrange', 'playerBlue', 'playerRed', 'playerYellow', 'playerGreen'];
        const playersInGame = order.filter(player => gameState.activePlayers.includes(player));
        const currentIndex = playersInGame.indexOf(HAND_KEY);
        const nextIndex = (currentIndex + 1) % playersInGame.length;
        
        if (options) options.innerHTML = '';
        updateData.turn = playersInGame[nextIndex]; // Cambio de turno automáticamente en la nube
    }

    await firebaseMock.updateGame(GAME_ID, 
        updateData
    );
}

export async function exileCard(cardIndex) {
    if (!gameState[HAND_KEY] || gameState[HAND_KEY].length === 0) return;

    // Clon de los arrays
    const tempHand = [...gameState[HAND_KEY]];
    const tempExile = [...gameState.exileZone];

    // Quita la carta del array local
    const [excluded] = tempHand.splice(cardIndex, 1);
    tempExile.push(excluded.cardPhoto);

    renderHandPlayer(tempHand, handTemp);

    await firebaseMock.updateGame(GAME_ID, {
        [HAND_KEY]: tempHand,
        exileZone: tempExile
    });
}

export async function useCard(cardIndex) {
    if (!gameState[HAND_KEY] || gameState[HAND_KEY].length === 0) return;
    const selectedCard = gameState[HAND_KEY][cardIndex];

    // valida organos duplicados
    if (selectedCard.type === 'organ') {
        const tempBody = [...gameState[BODY_KEY]];
        const hasDuplicate = tempBody.some(organ => organ.name === selectedCard.name);
        if (hasDuplicate) {
            alert(`¡Ya tienes un ${selectedCard.name} en tu cuerpo! No puedes duplicarlo.`);
            passTurn(); 
            return; 
        }

        const tempHand = [...gameState[HAND_KEY]];    
        const organCard = tempHand.splice(cardIndex, 1)[0];

        tempBody.push({
            name: organCard.name,
            cardPhoto: organCard.cardPhoto,
            viruses: [],
            medicines: []
        });

        renderHandPlayer(tempHand, handTemp);

        const hasWon = checkBodyVictory(tempBody);

        let updateData = {
            [HAND_KEY]: tempHand,
            [BODY_KEY]: tempBody
        };

        if (hasWon) {
            updateData.state = "finalizado";
            updateData.winner = HAND_KEY;
        }

        // Subida única y sólida a Firebase
        await firebaseMock.updateGame(GAME_ID, updateData);
    }else if(selectedCard.type === 'virus'){
        // Guarda la carta seleccionada y su posición en la mano
        activeTargetingCard = { ...selectedCard, index: cardIndex };
        
        // Cambio de cursor para dar feedback visual al usuario
        document.body.style.cursor = 'crosshair'; 
        alert(`Has seleccionado ${selectedCard.name}. Haz clic en el órgano que deseas infectar.`); // mensaje temporal para verificar compilacion
    } else if (selectedCard.type === 'medicine'){
        // Guarda la carta seleccionada y su posición en la mano
        activeTargetingCard = { ...selectedCard, index: cardIndex };
        
        // Cambio de cursor para dar feedback visual al usuario
        const bodyGameElem = document.querySelector('.bodyGame');
        if (bodyGameElem) bodyGameElem.style.cursor = 'crosshair'; 
        alert(`Has seleccionado ${selectedCard.name}. Haz clic en el órgano que deseas vacunar.`); // mensaje temporal para verificar compilacion
    } else if (selectedCard.type === 'treatment' && selectedCard.name === 'contagion') {
        // Guarda la carta de tratamiento activa
        activeTargetingCard = { ...selectedCard, index: cardIndex };
        document.body.style.cursor = 'crosshair'; 
        alert("¡Contagio activado! Primero haz clic en uno de TUS órganos infectados para tomar el virus.");
    }  else if (selectedCard.type === 'treatment' && selectedCard.name === 'glove') {
        // Ejecuta el efecto inmediatamente pasando la posición de la carta en la mano
        import('./treatmentManager.js').then(m => m.applyGloveEffect(cardIndex));
    } else if (selectedCard.type === 'treatment' && selectedCard.name === 'thief') {
        activeTargetingCard = { ...selectedCard, index: cardIndex };
        document.body.style.cursor = 'crosshair'; 
        alert("¡Ladrón activado! Haz clic en el órgano de un rival que desees robar.");
    }
}











