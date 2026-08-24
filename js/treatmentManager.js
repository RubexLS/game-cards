import { gameState, HAND_KEY, GAME_ID, BODY_KEY } from './state.js';
import { firebaseMock } from './firebaseMock.js';
import { activeTargetingCard, setActiveTargetingCard } from './gameActions.js';
import { renderHandPlayer } from './ui.js';
import { handTemp, options } from './domElements.js';

// controla los clics internos de las cartas que requieren 2 pasos
let contagionSource = null;
let transplantSource = null;

// Enrutador principal de tratamientos
export function handleTreatmentClick(organTarget) {
    switch (activeTargetingCard.name) {
        case 'contagion':
            processContagion(organTarget);
            break;
        case 'thief':
            processThief(organTarget);
            break;
        case 'transplant':
            processTransplant(organTarget);
            break;
        case 'medical_error':
            processMedicalError(organTarget);
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
        
        // Quita el virus de nuestro organo
        const myBody = JSON.parse(JSON.stringify(gameState[BODY_KEY] || []));
        const myOrgan = myBody.find(o => o.name === contagionSource.organName);
        myOrgan.viruses.pop();

        // inyecta el virus al rival
        if (!rivalOrgan.viruses) rivalOrgan.viruses = [];
        rivalOrgan.viruses.push(contagionSource.virusData);

        await finishTreatment('contagion', { 
            [BODY_KEY]: myBody,
            [targetBodyKey]: rivalBody 
        });
        alert("¡Brote epidemiológico ejecutado con éxito!");
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

async function processThief(organTarget) {
    const targetBodyKey = organTarget.dataset.propietario;
    const targetOrganName = organTarget.dataset.organo;

    // 1. CONDICIÓN: Debe ser el cuerpo de un rival
    if (targetBodyKey === BODY_KEY) {
        alert("¡No puedes robarte a ti mismo! Elige el órgano de un rival.");
        return;
    }

    // 2. CONDICIÓN: Comprobar que yo no tenga ya ese órgano (Evitar duplicados)
    const myBody = JSON.parse(JSON.stringify(gameState[BODY_KEY] || []));
    const hasDuplicate = myBody.some(organ => organ.name === targetOrganName);
    if (hasDuplicate) {
        alert(`¡No puedes robar este órgano! Ya tienes un ${targetOrganName} en tu cuerpo.`);
        // Cancelamos la jugada sin gastar la carta restaurando la mano
        setActiveTargetingCard(null);
        document.body.style.cursor = 'default';
        return;
    }

    // 3. CONDICIÓN: Verificar el estado del órgano en el rival
    const rivalBody = JSON.parse(JSON.stringify(gameState[targetBodyKey] || []));
    const organIdx = rivalBody.findIndex(o => o.name === targetOrganName);
    
    if (organIdx === -1) {
        alert("Ese rival ya no tiene ese órgano en su cuerpo.");
        return;
    }

    const rivalOrgan = rivalBody[organIdx];
    const currentMedicines = rivalOrgan.medicines || [];

    // REGLA: Si tiene 2 o más vacunas, es inmune y no se puede robar
    if (currentMedicines.length >= 2) {
        alert("¡Ese órgano es inmune! Tiene dos o más vacunas y el Ladrón no puede tocarlo.");
        return;
    }

    // --- SI PASA TODAS LAS VALIDACIONES, SE EJECUTA EL ROBO ---

    // Extrayendo el órgano completo del rival (con sus virus y medicinas actuales)
    const [stolenOrgan] = rivalBody.splice(organIdx, 1);

    // Lo indexamos a nuestro propio cuerpo
    myBody.push(stolenOrgan);

    await finishTreatment('thief', { 
        [BODY_KEY]: myBody, 
        [targetBodyKey]: rivalBody 
    });

    alert("¡Órgano robado con éxito! Ve al mazo a robar para finalizar tu turno.");
}

async function processTransplant(organTarget) {
    const targetBodyKey = organTarget.dataset.propietario;
    const targetOrganName = organTarget.dataset.organo;

    // 1 Selecciona el primer órgano (puede ser propio o del rival)
    if (!transplantSource) {
        const currentBody = gameState[targetBodyKey] || [];
        const organInBody = currentBody.find(o => o.name === targetOrganName);

        if (organInBody?.medicines?.length >= 2) {
            alert("No puedes trasplantar un órgano inmune.");
            return;
        }

        transplantSource = {
            bodyKey: targetBodyKey,
            organName: targetOrganName
        };

        document.body.style.cursor = 'move';
        alert(`Seleccionado ${targetOrganName}. Ahora haz clic en el segundo órgano para intercambiarlos.`);
    } else {
        // 2 selecciona el segundo órgano
        if (targetBodyKey === transplantSource.bodyKey) {
            alert("Debes seleccionar un órgano de un cuerpo diferente para el intercambio.");
            return;
        }

        // definicion de cual es mi cuerpo y quién es el del rival en esta interacción
        const myKey = transplantSource.bodyKey === BODY_KEY ? transplantSource.bodyKey : targetBodyKey;
        const rivalKey = transplantSource.bodyKey === BODY_KEY ? targetBodyKey : myKey;

        const myBody = JSON.parse(JSON.stringify(gameState[myKey] || []));
        const rivalBody = JSON.parse(JSON.stringify(gameState[rivalKey] || []));

        const nameOrganA = transplantSource.organName;
        const nameOrganB = targetOrganName;

        const idxA = myBody.findIndex(o => o.name === (transplantSource.bodyKey === myKey ? nameOrganA : nameOrganB));
        const idxB = rivalBody.findIndex(o => o.name === (transplantSource.bodyKey === rivalKey ? nameOrganA : nameOrganB));

        const organRival = rivalBody[idxB];

        if (organRival?.medicines?.length >= 2) {
            alert("El órgano del rival es inmune. No se puede trasplantar.");
            return;
        }

        // Evita que tras el cambio alguien se quede con órganos duplicados
        // Solo importa si los órganos que se intercambian son de tipos DIFERENTES
        if (nameOrganA !== nameOrganB) {
            const myOrganExist = myBody.some((o, i) => o.name === nameOrganB && i !== idxA);
            const rivalOrganExist = rivalBody.some((o, i) => o.name === nameOrganA && i !== idxB);

            if (myOrganExist || rivalOrganExist) {
                alert("El intercambio causaría un órgano duplicado en uno de los cuerpos. Movimiento inválido.");
                return;
            }
        }

        // Intercambio físico de objetos en los arrays
        const [organA] = myBody.splice(idxA, 1);
        const [organB] = rivalBody.splice(idxB, 1);
        myBody.push(organB);
        rivalBody.push(organA);

        await finishTreatment('transplant', { [myKey]: myBody, [rivalKey]: rivalBody });
        alert("¡Trasplante realizado con éxito!");
    }
}

async function processMedicalError(organTarget) {
    const targetBodyKey = organTarget.dataset.propietario;

    if (targetBodyKey === BODY_KEY) {
        alert("Debes seleccionar el órgano de un rival para intercambiar todo tu cuerpo con él.");
        return;
    }

    // Intercambio completo de los cuerpos
    const myBody = JSON.parse(JSON.stringify(gameState[BODY_KEY] || []));
    const rivalBody = JSON.parse(JSON.stringify(gameState[targetBodyKey] || []));

    await finalizarTratamiento('medical_error', {
        [BODY_KEY]: rivalBody,
        [targetBodyKey]: myBody
    });

    alert("¡Error Médico! Has intercambiado tu cuerpo por completo con tu rival.");
}

// === FUNCIÓN AUXILIAR CENTRALIZADA PARA LIMPIEZA Y CIERRE ===
async function finishTreatment(cardName, bodiesToUpdate) {
    const tempHand = JSON.parse(JSON.stringify(gameState[HAND_KEY] || []));
    const idx = tempHand.findIndex(c => c.name === cardName);
    const tempExile = JSON.parse(JSON.stringify(gameState.exileZone || []));
    
    if (idx !== -1) {
        const [usedCard] = tempHand.splice(idx, 1);
        tempExile.push(usedCard.cardPhoto);
    }

    // Verifica si la nueva configuración del cuerpo del jugador activa las condiciones de victoria
    const { checkBodyVictory } = await import('./state.js');
    // Busca si el cuerpo del jugador local cambió en este turno
    const miCuerpoActualizado = bodiesToUpdate[BODY_KEY] || gameState[BODY_KEY];
    const hasWon = checkBodyVictory(miCuerpoActualizado);

    let updateData = {
        [HAND_KEY]: tempHand,
        exileZone: tempExile,
        ...bodiesToUpdate
    };

    if (hasWon) {
        updateData.state = "finalizado";
        updateData.winner = HAND_KEY;
    }

    // Resetear estados de control de clicks
    setActiveTargetingCard(null);
    contagionSource = null;
    transplantSource = null; 
    document.body.style.cursor = 'default';
    if (options) options.innerHTML = '';

    const { renderHandPlayer } = await import('./ui.js');
    renderHandPlayer(tempHand, handTemp);
    await firebaseMock.updateGame(GAME_ID, updateData);
}