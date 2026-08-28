import { gameState, HAND_KEY, getStatus, BODY_KEY } from './state.js';
import { usedCardsTurn, recordUsage } from './state.js';
import { inDrawPhase } from './state.js';
import { useCard, exileCard, drawCard } from './gameActions.js';
import { handTemp, deckElement, deckCountElement, exileSlot, options, organBrain, organHeart, organStomach, organBone, organNervous, slotsRivalsDOM } from './domElements.js';

//Renderizado de la mano del jugador y control de las acciones con las cartas de la misma
export function renderHandPlayer(currentPLayer, contenedorHTML) {
    if (!contenedorHTML) return;
    contenedorHTML.innerHTML = '';

    currentPLayer.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        if (index === 0) cardDiv.className = 'card left-card';
        else if (index === 1) cardDiv.className = 'card medium-card';
        else if (index === 2) cardDiv.className = 'card right-card';
        cardDiv.style.backgroundImage = `url('${card.cardPhoto}')`;
        cardDiv.style.backgroundSize = "cover"; // hasta aqui se grafican las cartas de la mano
        
        //acciones disponibles al seleccionar una carta
        cardDiv.addEventListener('click', () => {
            if (!options) return;
            options.innerHTML = '';

            const enabled = !usedCardsTurn && !inDrawPhase;

            const btnUse = document.createElement('button');
            btnUse.className = 'option use'; 
            btnUse.innerText = enabled ? 'Usar' : (inDrawPhase ? 'Fase de Robo' : '1 por turno');
            btnUse.disabled = !enabled;
            
            const btnDiscard = document.createElement('button');
            btnDiscard.className = 'option discard'; 
            btnDiscard.innerText = 'Descartar';
            btnDiscard.disabled = inDrawPhase;
            
            options.appendChild(btnUse); options.appendChild(btnDiscard);

            btnDiscard.addEventListener('click', async () => { 
                options.innerHTML = ''; 
                await exileCard(index); 
            });
            btnUse.addEventListener('click', async () => { 
                if (!enabled) return; // multiples clicks
                // recordUsage(); // Bloquea la acción de "Usar" por el resto del turno
                // btnUse.disabled = true; 
                options.innerHTML = ''; 
                await useCard(index); 
            });
        });
        contenedorHTML.appendChild(cardDiv);  
    });
}

// Función para actualizar la interfaz visual de la mano
export function renderHand(keyword) {
    if (!handTemp) return;
    handTemp.innerHTML = '';
    const myCards = gameState[HAND_KEY] || [];

    renderHandPlayer(myCards, handTemp);
    if (getStatus()) {
        handTemp.classList.remove('disabled');
    } else {
        handTemp.classList.add('disabled');
    }
}

// renderizado y actualizado de los slots del tablero
export function renderBoard(cardImage) {
    if (!deckCountElement || !deckElement || !exileSlot) return;
    deckCountElement.innerText = gameState.deck.length;
    if (gameState.deck.length === 0) { 
        deckElement.style.backgroundColor = '#7f8c8d'; 
        deckElement.innerText = 'Vacío'; 
    } else { 
        deckElement.style.backgroundColor = ''; 
        deckElement.innerText = ''; 
    }

    if (gameState.exileZone?.length > 0) {
        const lastCard = gameState.exileZone[gameState.exileZone.length - 1];
        exileSlot.className = 'card'; 
        exileSlot.innerText = '';
        exileSlot.style.backgroundImage = `url('${lastCard}')`;
        exileSlot.style.backgroundSize = "cover";
    } else { 
        exileSlot.className = 'card-slot'; 
        exileSlot.innerText = 'Vacío'; 
        exileSlot.style.backgroundImage = ''; }
}

// Renderizado del cuerpo del jugador y sus rivales
export function renderBodyBoard (bodyKey, slotsHTML) {
    if (!slotsHTML) return;
    Object.values(slotsHTML).forEach(s => { if (s) s.innerHTML = ''; });

    const bodyCards = gameState[bodyKey] || [];
    bodyCards.forEach(card => {
        let slot; 
        const div = document.createElement('div');
        switch (card.name) {
            case 'brain': div.className = 'organ brain-card'; slot = slotsHTML.brain; break;
            case 'heart': div.className = 'organ heart-card'; slot = slotsHTML.heart; break;
            case 'stomach': div.className = 'organ stomach-card'; slot = slotsHTML.stomach; break;
            case 'bone': div.className = 'organ bone-card'; slot = slotsHTML.bone; break;
            default: div.className = 'organ nervous-card'; slot = slotsHTML.nervous; break;
        }
        if (slot) {
            div.style.cssText = `
                background-image: url('${card.cardPhoto}');
                background-size: 100% 100%; 
                width: 100%; 
                height: 100%;
            `;

            // Atributos de metadatos listos para cuando lances virus
            div.dataset.propietario = bodyKey; 
            div.dataset.organo = card.name;

            // inyeccion de contenedor de iconos (virus, vacunas, inmunidad)
            const container = document.createElement('div'); 
            container.className = 'organ-tokens';

            // asegurar la existencia de los arrays de medicinas y virus
            const currentViruses = card.viruses || [];
            const currentMedicines = card.medicines || [];

            // Renderizar el icono de Virus
            (currentViruses).forEach(v => { 
                const virusToken = document.createElement('div');
                virusToken.className = `token virus-token ${v.color}`;
                virusToken.style.backgroundImage = `url('../assets/icons/${v.color}_virus_icon.png')`; 
                container.appendChild(virusToken); 
            });

            // Renderiza el icono de Medicina
            (currentMedicines).forEach(m => {
                const medToken = document.createElement('div');
                medToken.className = `token medicine-token ${m.color}`; 
                medToken.style.backgroundImage = `url('../assets/icons/${m.color}_medicine_icon.png')`;
                container.appendChild(medToken); 
            });

            // Si tiene 2 vacunas o más, añade la clase de inmunidad al órgano
            if ((currentMedicines).length >= 2) {
                div.classList.add('is-immune');
            }

            // inyecta los iconos dentro del órgano antes de agregarlo al slot
            div.appendChild(container); slot.appendChild(div);
        }
    });
    Object.values(slotsHTML).forEach(s => { 
        if (s && s.children.length === 0) s.innerText = 'Vacío'; 
    });
}

// Inyeccion visual
export function renderBody() {
    // Dibuja el cuerpo local
    renderBodyBoard(BODY_KEY, { 
        brain: organBrain, 
        heart: organHeart, 
        stomach: organStomach, 
        bone: organBone, 
        nervous: organNervous 
    });

    // Rota y dibuja los cuerpos de los rivales
    if (!BODY_KEY) return;
    //Filtra los cuerpos de jugadores que están actualmente en partida
    const activeBodies = gameState.activePlayers.map(p => 
        p.replace('player', 'body')
    );
    // Busca en qué posición del array global esta ubicado
    const index = activeBodies.indexOf(BODY_KEY);
    // Corte y reordenamiento del array 
    const rotated = [
        ...activeBodies.slice(index + 1),
        ...activeBodies.slice(0, index)
    ];

    // Limpia todos los contenedores del DOM de rivales por seguridad (evita fantasmas de partidas anteriores)
    slotsRivalsDOM.forEach(s => {
        Object.values(s).forEach(d => { if (d) d.innerHTML = 'Vacío'; })
    });
    // Mapea a los 4 oponentes en los 4 contenedores relativos del DOM
    rotated.forEach((key, index) => { 
        const slotDestiny = slotsRivalsDOM[index];
        if (slotDestiny) {
            renderBodyBoard(key, slotDestiny);
        }
    });
}

// Detecta clicks en el mazo
if (deckElement) {
    deckElement.addEventListener('click', drawCard);
}

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

