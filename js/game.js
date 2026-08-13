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

    recordUsage();

    // Clona de los array
    const tempHand = [...gameState[HAND_KEY]];
    const tempBody = [...gameState[BODY_KEY]];
    
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

    // Buscamos en qué posición del array global esta ubicado
    const indexLocation = ALL_BODY.indexOf(BODY_KEY);

    // Corte y reordenamiento del array 
    const rotatedRivals = [
        ...ALL_BODY.slice(indexLocation + 1),
        ...ALL_BODY.slice(0, indexLocation)
    ];

    // Mapea a los 4 oponentes en los 4 contenedores relativos del DOM
    rotatedRivals.forEach((rivalKey, index) => {
        const slotDestiny = slotsRivalsDOM[index];
        if (slotDestiny) {
            renderBodyBoard(rivalKey, slotDestiny);
        }
    });
}
