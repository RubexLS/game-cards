import { firebaseMock, usedCardsTurn, recordUsage, passTurn } from './firebaseMock.js';
import { renderBodyBoard, handTemp } from './ui.js';
import { gameState, HAND_KEY, BODY_KEY, getStatus, GAME_ID, inDrawPhase, resetDrawPhase, startDrawPhase } from './state.js';

const options = document.getElementById('options');
const ALL_BODY = ['bodyOrange', 'bodyBlue', 'bodyRed', 'bodyYellow', 'bodyGreen'];

export const organBrain = document.getElementById('brain-slot');
export const organHeart = document.getElementById('heart-slot');
export const organStomach = document.getElementById('stomach-slot');
export const organBone = document.getElementById('bone-slot');
export const organNervous = document.getElementById('nervous-slot');

const slotsRivalsDOM = [
    {
        brain: document.getElementById('brain-slot-rivalOne'),
        heart: document.getElementById('heart-slot-rivalOne'),
        stomach: document.getElementById('stomach-slot-rivalOne'),
        bone: document.getElementById('bone-slot-rivalOne'),
        nervous: document.getElementById('nervous-slot-rivalOne')
    },
    {
        brain: document.getElementById('brain-slot-rivalTwo'),
        heart: document.getElementById('heart-slot-rivalTwo'),
        stomach: document.getElementById('stomach-slot-rivalTwo'),
        bone: document.getElementById('bone-slot-rivalTwo'),
        nervous: document.getElementById('nervous-slot-rivalTwo')
    },
    {
        brain: document.getElementById('brain-slot-rivalThree'),
        heart: document.getElementById('heart-slot-rivalThree'),
        stomach: document.getElementById('stomach-slot-rivalThree'),
        bone: document.getElementById('bone-slot-rivalThree'),
        nervous: document.getElementById('nervous-slot-rivalThree')
    },
    {
        brain: document.getElementById('brain-slot-rivalFour'),
        heart: document.getElementById('heart-slot-rivalFour'),
        stomach: document.getElementById('stomach-slot-rivalFour'),
        bone: document.getElementById('bone-slot-rivalFour'),
        nervous: document.getElementById('nervous-slot-rivalFour')
    }
];

let activeTargetingCard = null;

export class Cards {
    static typeCards = [];
    static deck = [];

    constructor(name, cardPhoto, amount, type, color) {
        this.name = name
        Cards.typeCards.push(this)
        this.cardPhoto = cardPhoto
        this.amount = amount
        this.type = type
        this.color = color
    }

    static buildDeck(){
        Cards.deck = [];
        Cards.typeCards.forEach(card => {
            for(let i = 0; i < card.amount; i++){
                Cards.deck.push({
                    name: card.name,
                    cardPhoto: card.cardPhoto,
                    type: card.type,
                    color: card.color
                });
            }
        });
    }

    static mingle() {
        for (let i = Cards.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [Cards.deck[i], Cards.deck[j]] = [Cards.deck[j], Cards.deck[i]];
        }
    }
}

Cards.typeCards = []; 

let bone = new Cards('bone', '/assets/cards/bone.png', 5, 'organ', 'yellow');
let brain = new Cards('brain', '/assets/cards/brain.png', 5, 'organ', 'blue');
let heart = new Cards('heart', '/assets/cards/heart.png', 5, 'organ', 'red');
let stomach = new Cards('stomach', '/assets/cards/stomach.png', 5, 'organ', 'green');
let nervousSystem = new Cards('nervousSystem', '/assets/cards/rainbow_organ.png', 1, 'organ', 'rainbow');

let yellowMedicine = new Cards('yellow_medicine', '/assets/cards/yellow_medicine.png', 4, 'medicine', 'yellow');
let blueMedicine = new Cards('blue_medicine', '/assets/cards/blue_medicine.png', 4, 'medicine', 'blue');
let redMedicine = new Cards('red_medicine', '/assets/cards/red_medicine.png', 4, 'medicine', 'red');
let greenMedicine = new Cards('green_medicine', '/assets/cards/green_medicine.png', 4, 'medicine', 'green');
let rainbowMedicine = new Cards('rainbow_medicine', '/assets/cards/rainbow_medicine.png', 4, 'medicine', 'rainbow');

let yellowVirus = new Cards('yellow_virus', '/assets/cards/yellow_virus.png', 4, 'virus', 'yellow');
let blueVirus = new Cards('blue_virus', '/assets/cards/blue_virus.png', 4, 'virus', 'blue');
let redVirus = new Cards('red_virus', '/assets/cards/red_virus.png', 4, 'virus', 'red');
let greenVirus = new Cards('green_virus', '/assets/cards/green_virus.png', 4, 'virus', 'green');
let rainbowVirus = new Cards('rainbow_virus', '/assets/cards/rainbow_virus.png', 1, 'virus', 'rainbow');

let contagion = new Cards('contagion', '/assets/cards/contagion.png', 2, 'treatment', 'purple');
let thief = new Cards('thief', '/assets/cards/thief.png', 3, 'treatment', 'purple');
let transplant = new Cards('transplant', '/assets/cards/transplant.png', 3, 'treatment', 'purple');
let glove = new Cards('glove', '/assets/cards/glove.png', 1, 'treatment', 'purple');
let medicalError = new Cards('medical_error', '/assets/cards/medical_error.png', 1, 'treatment', 'purple');

//Renderizado de la mano del jugador y control de las acciones con las cartas de la misma
export function renderHandPlayer(currentPLayer, contenedorHTML) {
    contenedorHTML.innerHTML = '';

    currentPLayer.forEach((card, index) => {
        const cardDiv = document.createElement('div');

        if (index === 0) cardDiv.className = 'card left-card';
        else if (index === 1) cardDiv.className = 'card medium-card';
        else if (index === 2) cardDiv.className = 'card right-card';

        cardDiv.style.backgroundImage = `url('${card.cardPhoto}')`;
        cardDiv.style.backgroundSize = "cover"; // Hasta este punto se grafica cada una de las cartas de la mano
        
        //acciones disponibles al seleccionar una carta
        cardDiv.addEventListener('click', () => {
            options.innerHTML = '';

            const enabled = !usedCardsTurn && !inDrawPhase;

            const optionUse = document.createElement('button');
            optionUse.className = 'option use';
            optionUse.innerText = enabled ? 'Usar' : (inDrawPhase ? 'Fase de Robo' : '1 por turno');
            optionUse.disabled = !enabled;
            
            const optionDiscard = document.createElement('button');
            optionDiscard.className = 'option discard';
            optionDiscard.innerText = 'Descartar';
            optionDiscard.disabled = inDrawPhase;
            
            options.appendChild(optionUse);
            options.appendChild(optionDiscard);

            optionDiscard.addEventListener('click', async () => {
                options.innerHTML = '';
                await exileCard(index);
            });

            optionUse.addEventListener('click', async () => {
                // en caso de multiples clicks
                if (!enabled) return; 
                recordUsage(); // Bloquea la acción de "Usar" por el resto del turno
                optionUse.disabled = true;
                options.innerHTML = '';
                await useCard(index);
            });
        });
        contenedorHTML.appendChild(cardDiv);  
    });
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
    if (!inDrawPhase) {
        startDrawPhase();
    }

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
        resetDrawPhase(); // Limpiamos el candado local para su siguiente turno
        passTurn(); 
        
        const orderPlayers = ['playerOrange', 'playerBlue', 'playerRed', 'playerYellow', 'playerGreen'];
        const playersInGame = orderPlayers.filter(player => gameState.activePlayers.includes(player));
        const currentIndex = playersInGame.indexOf(HAND_KEY);
        const nextIndex = (currentIndex + 1) % playersInGame.length;
        
        options.innerHTML = '';
        updateData.turn = playersInGame[nextIndex]; // Cambio de turno automáticamente en la nube
    }

    await firebaseMock.updateGame(GAME_ID, 
        updateData
    );
}

async function exileCard(cardIndex) {
    if (!gameState[HAND_KEY] || gameState[HAND_KEY].length === 0) return;

    // Clon de los arrays
    const tempHand = [...gameState[HAND_KEY]];
    const tempExile = [...gameState.exileZone];

    // Quita la carta del array local
    const excludedCard = tempHand.splice(cardIndex, 1)[0];
    tempExile.push(excludedCard.cardPhoto);

    renderHandPlayer(tempHand, handTemp);

    await firebaseMock.updateGame(GAME_ID, {
        [HAND_KEY]: tempHand,
        exileZone: tempExile
    });
}

async function useCard(cardIndex) {
    if (!gameState[HAND_KEY] || gameState[HAND_KEY].length === 0) return;

    const selectedCard = gameState[HAND_KEY][cardIndex];

    // valida organos duplicados
    if (selectedCard.type === 'organ') {
        const tempBody = [...gameState[BODY_KEY]];
        const hasDuplicate = tempBody.some(organ => organ.name === selectedCard.name);
        
        if (hasDuplicate) {
            alert(`¡Ya tienes un ${selectedCard.name} en tu cuerpo! No puedes duplicarlo.`);
            return; // Bloquea la ejecución y mantiene la carta en la mano
        }
    
        recordUsage();

        const tempHand = [...gameState[HAND_KEY]];    
        const organCard = tempHand.splice(cardIndex, 1)[0];

        tempBody.push({
            name: organCard.name,
            cardPhoto: organCard.cardPhoto
        });

        renderHandPlayer(tempHand, handTemp);

        await firebaseMock.updateGame(GAME_ID, {
            [HAND_KEY]: tempHand,
            [BODY_KEY]: tempBody
        });
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
        document.querySelector('.bodyGame').style.cursor = 'crosshair'; 
        alert(`Has seleccionado ${selectedCard.name}. Haz clic en el órgano que deseas vacunar.`); // mensaje temporal para verificar compilacion
    }
}

// Inyeccion visual
export function renderBody() {
    // Dibuja el cuerpo local
    const myOrganSlots = {
        brain: organBrain,
        heart: organHeart,
        stomach: organStomach,
        bone: organBone,
        nervous: organNervous
    };
    renderBodyBoard(BODY_KEY, myOrganSlots);

    // Rota y dibuja los cuerpos de los rivales
    if (!BODY_KEY) return;

    //Filtra los cuerpos de jugadores que están actualmente en partida
    const activeBodies = gameState.activePlayers.map(playerKey => 
        playerKey.replace('player', 'body')
    );

    // Buscamos en qué posición del array global esta ubicado
    const indexLocation = activeBodies.indexOf(BODY_KEY);

    // Corte y reordenamiento del array 
    const rotatedRivals = [
        ...activeBodies.slice(indexLocation + 1),
        ...activeBodies.slice(0, indexLocation)
    ];

    // Limpia todos los contenedores del DOM de rivales por seguridad (evita fantasmas de partidas anteriores)
    slotsRivalsDOM.forEach(slot => {
        Object.values(slot).forEach(div => { if (div) div.innerHTML = 'Vacío'; });
    });

    // Mapea a los 4 oponentes en los 4 contenedores relativos del DOM
    rotatedRivals.forEach((rivalKey, index) => {
        const slotDestiny = slotsRivalsDOM[index];
        if (slotDestiny) {
            renderBodyBoard(rivalKey, slotDestiny);
        }
    });
}

// Escuchamos los clics en todo el documento para atrapar los clics en los órganos
document.addEventListener('click', async (event) => {
    if (!activeTargetingCard) return;

    // Deteccion de click en elementos con la clase 'organ'
    const organTarget = event.target.closest('.organ');
    if (!organTarget) return; 

    // información del órgano a traves de los datasets de renderBodyBoard
    const targetBodyKey = organTarget.dataset.propietario;
    const targetOrganName = organTarget.dataset.organo;
    // datos del cuerpo afectado desde el estado global
    const targetBody = [...gameState[targetBodyKey]];
    
    // Encontrar el objeto exacto del órgano dentro del cuerpo
    const organInBody = targetBody.find(o => o.name === targetOrganName);
    if (!organInBody) return;

    // --- funcion auxiliar para cancelar la jugada sin perder la carta ni turno ---
    const cancelarJugada = (mensaje) => {
        alert(mensaje);
        activeTargetingCard = null;
        document.body.style.cursor = 'default';
        const bodyGameElem = document.querySelector('.bodyGame');
        if (bodyGameElem) bodyGameElem.style.cursor = 'default';
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
    const tempExile = [...gameState.exileZone];

    if (activeTargetingCard.type === 'virus') {
        if (organInBody.medicines.length >= 2) {
            cancelarJugada("¡Este órgano es inmune! Tiene dos vacunas y no puede recibir virus.");
            return;
        }
    } else if (activeTargetingCard.type === 'medicine') {
        if (organInBody.medicines.length >= 2) {
            cancelarJugada("¡Este órgano ya es inmune, no necesita más vacunas!");
            return;
        }
    }

    if(activeTargetingCard.type === 'virus') {

        if (organInBody.medicines.length > 0) { // si el organo tiene una medicina
            alert("¡El virus ha destruido la medicina protectora del órgano!"); // mensaje temporal
        
            const destroyedMedicine = organInBody.medicines.pop();

            tempExile.push(destroyedMedicine.cardPhoto);
            tempExile.push(activeTargetingCard.cardPhoto);

        } else {
            if (organInBody.viruses.length === 1) { // si el organo ya tiene un virus lo destruye
                alert("¡Segundo virus! El órgano ha sido completamente destruido y se va al exilio."); // mensaje temporal
            
                tempExile.push(organInBody.cardPhoto);
                organInBody.viruses.forEach(v => tempExile.push(v.cardPhoto));
                tempExile.push(activeTargetingCard.cardPhoto);

                const organIndex = targetBody.findIndex(o => o.name === targetOrganName);
                targetBody.splice(organIndex, 1);

            } else { // Si estaba sano (0 virus), simplemente agrega el virus (aparecera el icono)
                alert("¡Órgano infectado correctamente!");
            
                organInBody.viruses.push({
                    name: activeTargetingCard.name,
                    cardPhoto: activeTargetingCard.cardPhoto,
                    color: activeTargetingCard.color
                });
            }
        }
    } else if (activeTargetingCard.type === 'medicine') {
        if (organInBody.viruses.length > 0) {
            alert("¡La medicina ha curado y destruido el virus del órgano!");
            const curedVirus = organInBody.viruses.pop();
            tempExile.push(curedVirus.cardPhoto);
            tempExile.push(activeTargetingCard.cardPhoto);
        } else {
            alert("¡Órgano vacunado correctamente!");
            organInBody.medicines.push({
                name: activeTargetingCard.name,
                cardPhoto: activeTargetingCard.cardPhoto,
                color: activeTargetingCard.color
            });
        }
    }

    recordUsage(); // Candado en un solo uso por dia

    // Remueve el virus de la mano del jugador
    const tempHand = [...gameState[HAND_KEY]];
    tempHand.splice(activeTargetingCard.index, 1); //[0]

    // Limpiar el modo objetivo
    activeTargetingCard = null;
    document.body.style.cursor = 'default';
    const bodyGameElem = document.querySelector('.bodyGame');
    if (bodyGameElem) bodyGameElem.style.cursor = 'default';

    await firebaseMock.updateGame(GAME_ID, {
        [HAND_KEY]: tempHand,
        [targetBodyKey]: targetBody,
        exileZone: tempExile
    });

    alert("¡Órgano completada con éxito!");
});