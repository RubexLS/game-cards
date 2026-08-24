import { gameState, HAND_KEY, BODY_KEY, GAME_ID, checkBodyVictory } from './state.js';
import { firebaseMock } from './firebaseMock.js';
import { renderHandPlayer, renderHand } from './ui.js';
import { handTemp } from './domElements.js';
import { activeTargetingCard, setActiveTargetingCard } from './gameActions.js';

export function initTargetListener() {
    // Escuchamos los clics en todo el documento para atrapar los clics en los órganos
    document.addEventListener('click', async (event) => {
        if (!activeTargetingCard) return;

        if (activeTargetingCard.type === 'treatment') {
            const organTarget = event.target.closest('.organ');
            if (!organTarget) return;

            // Importamos el módulo y le pasamos el elemento clickeado
            const m = await import('./treatmentManager.js');
            m.handleTreatmentClick(organTarget);
            return; 
        }

        // Deteccion de click en elementos con la clase 'organ'
        const organTarget = event.target.closest('.organ');
        if (!organTarget) return; 

        // información del órgano a traves de los datasets de renderBodyBoard
        const targetBodyKey = organTarget.dataset.propietario;
        const targetOrganName = organTarget.dataset.organo;
        // datos del cuerpo afectado desde el estado global
        if (!gameState[targetBodyKey]) return;
        const targetBody = JSON.parse(JSON.stringify(gameState[targetBodyKey]));

        // Encontrar el objeto exacto del órgano dentro del cuerpo
        const organInBody = targetBody.find(o => o.name === targetOrganName);
        if (!organInBody) return;

        // --- funcion auxiliar para cancelar la jugada sin perder la carta ni turno ---
        const cancelarJugada = (mensaje) => {
            alert(mensaje);
            setActiveTargetingCard(null);
            document.body.style.cursor = 'default';
            const bodyGameElem = document.querySelector('.bodyGame');
            if (bodyGameElem) bodyGameElem.style.cursor = 'default';

            import('./state.js').then(s => s.passTurn());
            renderHand();
        };

        const colorMap = { 'bone': 'yellow', 'brain': 'blue', 'heart': 'red', 'stomach': 'green', 'nervousSystem': 'rainbow' };
        const targetColor = colorMap[targetOrganName];

        const isRainbowVirus = activeTargetingCard.color === 'rainbow';
        const isRainbowOrgan = targetOrganName === 'nervousSystem';
        // const colorsMatch = activeTargetingCard.name.includes(targetOrganName); 
        // Comparamos directamente las propiedades .color de la carta y del mapa
        const colorsMatch = activeTargetingCard.color === targetColor; 

        if (!isRainbowVirus && !isRainbowOrgan && !colorsMatch) {
            cancelarJugada("¡No puedes aplicar esta carta en ese órgano! Los colores no coinciden.");
            return;
        }

        // Inicia array de virus y medicinas del organo si no existe
        if (!organInBody.viruses) organInBody.viruses = [];
        if (!organInBody.medicines) organInBody.medicines = [];
        // Clon de la zona de exilio para mandar las cartas destruidas si aplica
        const tempExile = JSON.parse(JSON.stringify(gameState.exileZone || []));

        if (activeTargetingCard.type === 'virus' && organInBody.medicines.length >= 2) {
                cancelarJugada("¡Este órgano es inmune! Tiene dos vacunas y no puede recibir virus.");
                return;
        } else if (activeTargetingCard.type === 'medicine' && organInBody.medicines.length >= 2) {
                cancelarJugada("¡Este órgano ya es inmune, no necesita más vacunas!");
                return;
        }

        if(activeTargetingCard.type === 'virus') {

            if (organInBody.medicines.length > 0) { // si el organo tiene una medicina
                alert("¡El virus ha destruido la medicina protectora del órgano!"); // mensaje temporal
            
                const destroyedMedicine = organInBody.medicines.pop();

                tempExile.push(destroyedMedicine.cardPhoto);
                tempExile.push(activeTargetingCard.cardPhoto);

            } else if (organInBody.viruses.length === 1) { // si el organo ya tiene un virus lo destruye
                alert("¡Segundo virus! El órgano ha sido completamente destruido y se va al exilio."); // mensaje temporal

                tempExile.push(
                    organInBody.cardPhoto, 
                    organInBody.viruses[0].cardPhoto, 
                    activeTargetingCard.cardPhoto
                );
                const organIdx = targetBody.findIndex(o => o.name === targetOrganName);
                targetBody.splice(organIdx, 1);

            }else { // Si estaba sano (0 virus), simplemente agrega el virus (aparecera el icono)
                alert("¡Órgano infectado correctamente!");
                
                organInBody.viruses.push({ 
                    name: activeTargetingCard.name, 
                    cardPhoto: activeTargetingCard.cardPhoto, 
                    color: activeTargetingCard.color 
                });
            }
        } else if (activeTargetingCard.type === 'medicine') {
            if (organInBody.viruses.length > 0) {
                alert("¡La medicina ha curado y destruido el virus del órgano!");

                const cured = organInBody.viruses.pop();
                tempExile.push(
                    cured.cardPhoto, 
                    activeTargetingCard.cardPhoto
                );
            } else {
                alert("¡Órgano vacunado correctamente!");

                organInBody.medicines.push({ 
                    name: activeTargetingCard.name, 
                    cardPhoto: activeTargetingCard.cardPhoto, 
                    color: activeTargetingCard.color 
                });
            }
        }

        // Remueve el virus de la mano del jugador
        const tempHand = JSON.parse(JSON.stringify(gameState[HAND_KEY] || []));

        // Verificación de seguridad: confirmamos que la carta sigue ahí antes de removerla
        // Si el índice cambió por lag, busca su nueva posición exacta
        const idx = tempHand.findIndex(c => c.name === activeTargetingCard.name);
        if (idx !== -1) tempHand.splice(idx, 1);

        // Limpiar el modo objetivo
        setActiveTargetingCard(null);
        document.body.style.cursor = 'default';

        renderHandPlayer(tempHand, handTemp);

        const hasWon = checkBodyVictory(targetBody);
        let updateData = { 
            [HAND_KEY]: tempHand, 
            [targetBodyKey]: targetBody, 
            exileZone: tempExile 
        };
        
        // Si la acción completó la victoria (por ejemplo sanando el 4to órgano), cierra el juego en el mismo paquete
        if (hasWon) { 
            updateData.state = "finalizado"; 
            updateData.winner = targetBodyKey; 
        }
        
        // Guardado síncrono e irreversible en Firebase
        await firebaseMock.updateGame(GAME_ID, updateData);
    });
}