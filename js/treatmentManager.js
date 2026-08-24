import { gameState, HAND_KEY, GAME_ID, BODY_KEY } from './state.js';
import { firebaseMock } from './firebaseMock.js';
import { activeTargetingCard, setActiveTargetingCard } from './gameActions.js';
import { renderHandPlayer } from './ui.js';
import { handTemp, options } from './domElements.js';

// controla los clics internos de las cartas que requieren 2 pasos
let contagionSource = null; 

// Enrutador principal de tratamientos
export function handleTreatmentClick(organTarget) {
    switch (activeTargetingCard.name) {
        case 'contagion':
            processContagion(organTarget);
            break;
        case 'thief':
            // processThief(organTarget); // Listo para el futuro
            break;
        case 'transplant':
            // processTransplant(organTarget); // Listo para el futuro
            break;
        default:
            break;
    }
}

async function processContagion(organTarget) {
    const targetBodyKey = organTarget.dataset.propietario;
    const targetOrganName = organTarget.dataset.organo;

    // a: Seleccionar el virus de alguno de tus organos
    if (!contagionSource) {
        if (targetBodyKey !== BODY_KEY) {
            alert("selecciona un órgano de TU propio cuerpo que tenga virus.");
            return;
        }

        const myBody = gameState[BODY_KEY] || [];
        const organInBody = myBody.find(o => o.name === targetOrganName);

        if (!organInBody || !organInBody.viruses || organInBody.viruses.length === 0) {
            alert("Este órgano no tiene virus para contagiar. Elige otro.");
            return;
        }

        // Guarda el origen del virus
        contagionSource = {
            organName: targetOrganName,
            virusData: organInBody.viruses[organInBody.viruses.length - 1]
        };

        document.body.style.cursor = 'copy';
        alert(`Virus de ${targetOrganName} seleccionado. Selecciona el órgano sano que quieres infectar.`);
    } else { // b: Seleccionar el órgano del rival manualmente
        if (targetBodyKey === BODY_KEY) {
            alert("No puedes contagiarte a ti mismo. Elige el órgano de un rival.");
            return;
        }

        if (targetOrganName !== contagionSource.organName) {
            alert(`El Contagio debe ser al mismo tipo de órgano. Busca un ${contagionSource.organName} en un rival.`);
            return;
        }

        const rivalBody = JSON.parse(JSON.stringify(gameState[targetBodyKey] || []));
        const rivalOrgan = rivalBody.find(o => o.name === targetOrganName);

        if (!rivalOrgan) {
            alert("Ese rival no tiene ese órgano en su cuerpo todavía.");
            return;
        }

        const tieneVirus = rivalOrgan.viruses && rivalOrgan.viruses.length > 0;
        const tieneMedicinas = rivalOrgan.medicines && rivalOrgan.medicines.length > 0;

        if (tieneVirus || tieneMedicinas) {
            alert("¡Objetivo inválido! El órgano del rival debe estar completamente limpio (sin vacunas ni infecciones).");
            return;
        }

        // aplicacion de efectos
        
        // Quita el virus de nuestro organo
        const myBody = JSON.parse(JSON.stringify(gameState[BODY_KEY] || []));
        const myOrgan = myBody.find(o => o.name === contagionSource.organName);
        myOrgan.viruses.pop();

        // inyecta el virus al rival
        if (!rivalOrgan.viruses) rivalOrgan.viruses = [];
        rivalOrgan.viruses.push(contagionSource.virusData);

        // descarta la carta de la mano
        const tempHand = JSON.parse(JSON.stringify(gameState[HAND_KEY] || []));
        const idx = tempHand.findIndex(c => c.name === 'contagion');
        const tempExile = JSON.parse(JSON.stringify(gameState.exileZone || []));
        
        if (idx !== -1) {
            const [usedCard] = tempHand.splice(idx, 1);
            tempExile.push(usedCard.cardPhoto);
        }

        let updateData = {
            [HAND_KEY]: tempHand,
            [BODY_KEY]: myBody,
            [targetBodyKey]: rivalBody,
            exileZone: tempExile
        };

        // Resetear interfaz y estados locales
        setActiveTargetingCard(null);
        contagionSource = null; 
        document.body.style.cursor = 'default';
        if (options) options.innerHTML = '';
        
        const { renderHandPlayer } = await import('./ui.js');
        renderHandPlayer(tempHand, handTemp);

        alert("¡Brote epidemiológico ejecutado con éxito!");
        await firebaseMock.updateGame(GAME_ID, updateData);
    }
}

export async function applyGloveEffect(cardIndex) {
    // 1 clones profundos de seguridad
    const tempExile = JSON.parse(JSON.stringify(gameState.exileZone || []));
    const tempHand = JSON.parse(JSON.stringify(gameState[HAND_KEY] || []));

    // 2 descartamos la carta de tratamiento
    const [usedGlove] = tempHand.splice(cardIndex, 1);
    tempExile.push(usedGlove.cardPhoto);

    let updateData = {
        [HAND_KEY]: tempHand,
        exileZone: tempExile
    };

    // 3 Recorre a TODOS los rivales activos de la sala para destruir sus manos
    gameState.activePlayers.forEach(playerKey => {
        // Excluimos nuestra propia mano de la destrucción
        if (playerKey !== HAND_KEY) {
            const rivalHand = gameState[playerKey] || [];
            
            // Recorremos las cartas del rival y las descarta
            rivalHand.forEach(card => {
                if (card && card.cardPhoto) {
                    tempExile.push(card.cardPhoto);
                }
            });

            // Vacia la mano de este rival en el paquete de actualización
            updateData[playerKey] = [];
        }
    });

    // 5 Limpieza de UI local previa al envío de red
    setActiveTargetingCard(null);
    document.body.style.cursor = 'default';
    if (options) options.innerHTML = '';

    // reenderiza la mano actual (2 cartas)
    const { renderHandPlayer } = await import('./ui.js');
    renderHandPlayer(tempHand, handTemp);

    alert("¡Guante de Látex usado! Has obligado a todos tus rivales a descartar sus manos. Roba para finalizar tu turno.");

    await firebaseMock.updateGame(GAME_ID, updateData);
}
